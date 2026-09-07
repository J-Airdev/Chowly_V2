import express from 'express';
import db from '../db.js';
import { auth, waiter } from '../middleware/auth.js';
import { selectedRestaurant } from '../helpers.js';

const router = express.Router();

/**
 * GET /staff
 * Returns staff for waiter's restaurant
 */
router.get('/staff', auth, waiter, (req, res) => {
  const restaurant = selectedRestaurant(req, res);
  if (!restaurant) return;

  if (restaurant.id !== req.user.restaurantId) {
    return res.status(403).json({ error: 'Staff are only visible for your restaurant.' });
  }

  res.json(db.prepare('SELECT * FROM staff WHERE restaurant_id=? ORDER BY role, name').all(restaurant.id));
});

export default router;
