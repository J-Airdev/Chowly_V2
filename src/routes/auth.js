import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { sign } from '../middleware/auth.js';
import { restaurantFrom } from '../helpers.js';

const router = express.Router();

/**
 * POST /demo-session
 * Demo role switching (same logic as original)
 */
router.post('/demo-session', (req, res) => {
  const restaurant = restaurantFrom(req.body.restaurant_slug);
  const role = req.body.role;

  if (!restaurant || !['customer', 'waiter'].includes(role)) {
    return res.status(400).json({ error: 'Choose a valid role and restaurant.' });
  }

  const user = role === 'customer'
    ? db.prepare("SELECT * FROM users WHERE email='customer@chowly.test'").get()
    : db.prepare('SELECT * FROM users WHERE role=? AND restaurant_id=? ORDER BY id LIMIT 1').get('waiter', restaurant.id);

  if (!user) {
    return res.status(404).json({ error: 'No demo role is available for this restaurant.' });
  }

  res.json({
    token: sign(user),
    user: { id: user.id, name: user.name, role: user.role, restaurant_id: user.restaurant_id }
  });
});

/**
 * POST /auth/register
 * Register a new customer
 */
router.post('/auth/register', (req, res) => {
  const { name, email, password, restaurant_slug } = req.body;
  const restaurant = restaurantFrom(restaurant_slug);

  if (!restaurant || !name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, password, and restaurant are required.' });
  }

  if (password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
  }
  
  if (name.length > 100) {
    return res.status(400).json({ error: 'Name must be 100 characters or less.' });
  }

  if (email.length > 255) {
    return res.status(400).json({ error: 'Email must be 255 characters or less.' });
  }

  try {
    const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      name.trim(),
      email.toLowerCase().trim(),
      bcrypt.hashSync(password, 10),
      'customer'
    );
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json({
      token: sign(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch {
    res.status(409).json({ error: 'That email is already registered.' });
  }
});

/**
 * POST /auth/login
 * Login with email/password
 */
router.post('/auth/login', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(req.body.email?.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.json({
    token: sign(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurant_id: user.restaurant_id }
  });
});

export default router;
