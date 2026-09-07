import express from 'express';
import db from '../db.js';
import { selectedRestaurant } from '../helpers.js';

const router = express.Router();

/**
 * GET /menu
 * Returns menu items for the selected restaurant.
 */
router.get('/menu', (req, res) => {
  const restaurant = selectedRestaurant(req, res);
  if (restaurant) {
    res.json({
      restaurant,
      items: db.prepare('SELECT * FROM menu_items WHERE restaurant_id=? AND available=1 ORDER BY category, id').all(restaurant.id)
    });
  }
});

export default router;
