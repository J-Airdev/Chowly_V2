import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * GET /restaurants
 * Returns all restaurants.
 */
router.get('/restaurants', (_, res) => {
  res.json(db.prepare('SELECT id, name, slug, location, restaurant_type FROM restaurants ORDER BY name').all());
});

export default router;
