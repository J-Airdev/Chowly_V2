import db from './db.js';

/**
 * Gets a restaurant by slug. Defaults to 'the-bukka' if no slug provided.
 * @param {string} slug Restaurant slug
 * @returns {Object|null}
 */
export function restaurantFrom(slug) {
  return db.prepare('SELECT * FROM restaurants WHERE slug=?').get(slug || 'the-bukka') || null;
}

/**
 * Extracts and returns the restaurant based on request query/body.
 * Validates and handles 404 if not found.
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @returns {Object|null}
 */
export function selectedRestaurant(req, res) {
  const restaurant = restaurantFrom(req.query.restaurant || req.body?.restaurant_slug);
  if (!restaurant) {
    res.status(404).json({ error: 'Restaurant not found.' });
    return null;
  }
  return restaurant;
}

/**
 * Builds the full order record with related items, complaints, and payments.
 * @param {number} id Order ID
 * @returns {Object|null}
 */
export function orderRecord(id) {
  const order = db.prepare(`
    SELECT o.*, r.name restaurant_name, r.slug restaurant_slug, u.name customer_name,
           w.name waiter_name, COALESCE(SUM(oi.price_cents * oi.quantity), 0) total_cents,
           p.id payment_id, p.status payment_status, p.method payment_method, p.reference payment_reference, p.paid_at
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    JOIN users u ON u.id = o.customer_id
    LEFT JOIN users w ON w.id = o.waiter_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.id = ?
    GROUP BY o.id
  `).get(id);

  if (!order) return null;

  order.items = db.prepare(`
    SELECT oi.*, mi.category, c.name chef_name, b.name bartender_name
    FROM order_items oi
    LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
    LEFT JOIN staff c ON c.id = oi.chef_id
    LEFT JOIN staff b ON b.id = oi.bartender_id
    WHERE oi.order_id = ?
  `).all(id);

  order.complaint = db.prepare('SELECT * FROM complaints WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').get(id) || null;

  return order;
}

/**
 * Validates whether the given user has access to the given order.
 * @param {Object} order The order object
 * @param {Object} user The user object from JWT
 * @returns {boolean}
 */
export function checkOrderAccess(order, user) {
  return user.role === 'customer' 
    ? order.customer_id === user.id 
    : order.restaurant_id === user.restaurantId;
}
