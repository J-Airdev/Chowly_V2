import express from 'express';
import db from '../db.js';
import { auth, waiter } from '../middleware/auth.js';
import { selectedRestaurant, orderRecord, checkOrderAccess } from '../helpers.js';

const router = express.Router();

/**
 * POST /orders
 * Place an order (customer only)
 */
router.post('/orders', auth, (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can place orders.' });
  }

  const restaurant = selectedRestaurant(req, res);
  if (!restaurant) return;

  const requested = Array.isArray(req.body.items) ? req.body.items : [];
  if (!requested.length) {
    return res.status(400).json({ error: 'Add at least one menu item.' });
  }

  const ids = [...new Set(requested.map(i => Number(i.id)).filter(Number.isInteger))];
  const menu = ids.map(id => db.prepare('SELECT * FROM menu_items WHERE id=? AND restaurant_id=? AND available=1').get(id, restaurant.id)).filter(Boolean);

  if (menu.length !== ids.length) {
    return res.status(400).json({ error: 'A selected item is unavailable at this restaurant.' });
  }

  const quantities = new Map(requested.map(i => [Number(i.id), Math.max(1, Math.min(20, Number(i.quantity) || 1))]));

  const orderId = db.transaction(() => {
    let tableNumber = String(req.body.table_number || '').trim();
    if (tableNumber.length > 500) tableNumber = tableNumber.slice(0, 500); // Input validation

    const order = db.prepare('INSERT INTO orders (restaurant_id, customer_id, estimated_minutes, table_number) VALUES (?, ?, ?, ?)').run(
      restaurant.id,
      req.user.id,
      Math.max(...menu.map(m => m.prep_minutes)),
      tableNumber || null
    );

    const add = db.prepare('INSERT INTO order_items (order_id, menu_item_id, name, price_cents, quantity) VALUES (?, ?, ?, ?, ?)');
    menu.forEach(m => add.run(order.lastInsertRowid, m.id, m.name, m.price_cents, quantities.get(m.id)));

    return order.lastInsertRowid;
  })();

  res.status(201).json(orderRecord(orderId));
});

/**
 * GET /orders
 * List orders (different queries for customer vs waiter)
 */
router.get('/orders', auth, (req, res) => {
  const restaurant = selectedRestaurant(req, res);
  if (!restaurant) return;

  const isCustomer = req.user.role === 'customer';
  const sql = isCustomer
    ? 'SELECT id FROM orders WHERE customer_id=? AND restaurant_id=? AND customer_hidden_at IS NULL ORDER BY created_at DESC'
    : "SELECT id FROM orders WHERE restaurant_id=? ORDER BY CASE status WHEN 'placed' THEN 0 WHEN 'preparing' THEN 1 ELSE 2 END, created_at DESC";

  const args = isCustomer ? [req.user.id, restaurant.id] : [restaurant.id];
  res.json(db.prepare(sql).all(...args).map(row => orderRecord(row.id)));
});

/**
 * PATCH /orders/:id
 * Update order status and staff assignments (waiter only)
 */
router.patch('/orders/:id', auth, waiter, (req, res) => {
  const order = orderRecord(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (!checkOrderAccess(order, req.user)) {
    return res.status(403).json({ error: 'This order belongs to another restaurant.' });
  }

  if (order.customer_hidden_at) {
    return res.status(409).json({ error: 'This order was removed from customer history and is locked from further changes.' });
  }

  const { status, item_assignments = [] } = req.body;
  const allowed = { placed: ['placed', 'preparing'], preparing: ['preparing', 'served'], served: ['served'] };

  if (!allowed[order.status]?.includes(status)) {
    return res.status(400).json({ error: 'Orders must progress from Placed to Preparing to Served.' });
  }

  const validStaff = (id, role) => !id || db.prepare('SELECT id FROM staff WHERE id=? AND role=? AND restaurant_id=?').get(id, role, order.restaurant_id);

  for (const item of item_assignments) {
    if (!validStaff(item.chef_id, 'chef') || !validStaff(item.bartender_id, 'bartender')) {
      return res.status(400).json({ error: 'Assigned staff must belong to this restaurant and role.' });
    }
  }

  db.transaction(() => {
    db.prepare("UPDATE orders SET waiter_id=?, status=?, served_at=CASE WHEN ?='served' THEN CURRENT_TIMESTAMP ELSE served_at END WHERE id=?").run(
      req.user.id, status, status, order.id
    );

    const setItem = db.prepare('UPDATE order_items SET chef_id=?, bartender_id=?, status=? WHERE id=? AND order_id=?');
    for (const item of item_assignments) {
      setItem.run(item.chef_id || null, item.bartender_id || null, status, item.id, order.id);
    }
  })();

  res.json(orderRecord(order.id));
});

/**
 * POST /orders/:id/complaints
 * Submit feedback (customer only, rating 1-5)
 */
router.post('/orders/:id/complaints', auth, (req, res) => {
  const order = orderRecord(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (req.user.role !== 'customer' || !checkOrderAccess(order, req.user)) {
    return res.status(403).json({ error: 'You can only review your own order.' });
  }

  const rating = Number(req.body.rating);
  let description = String(req.body.description || '').trim();
  if (description.length > 500) description = description.slice(0, 500); // Input validation

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1 to 5.' });
  }

  db.prepare('INSERT INTO complaints (order_id, rating, description) VALUES (?, ?, ?)').run(order.id, rating, description || null);
  res.status(201).json(orderRecord(order.id));
});

/**
 * POST /orders/:id/payments
 * Record pretend payment (customer only)
 */
router.post('/orders/:id/payments', auth, (req, res) => {
  const order = orderRecord(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (req.user.role !== 'customer' || !checkOrderAccess(order, req.user)) {
    return res.status(403).json({ error: 'You can only pay for your own order.' });
  }

  if (!order.payment_id) {
    db.prepare('INSERT INTO payments (order_id, amount_cents, method, status, reference) VALUES (?, ?, ?, ?, ?)').run(
      order.id, order.total_cents, 'Pretend payment', 'paid', `CHW-${order.id}-${Date.now()}`
    );
  }

  res.json(orderRecord(order.id));
});

/**
 * DELETE /orders/:id
 * Hide paid order from customer history
 */
router.delete('/orders/:id', auth, (req, res) => {
  const order = orderRecord(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (req.user.role !== 'customer' || !checkOrderAccess(order, req.user)) {
    return res.status(403).json({ error: 'You can only remove your own order.' });
  }

  if (!order.payment_id) {
    return res.status(400).json({ error: 'Only paid orders can be removed from your history.' });
  }

  db.prepare('UPDATE orders SET customer_hidden_at=CURRENT_TIMESTAMP WHERE id=?').run(order.id);
  res.status(204).end();
});

export default router;
