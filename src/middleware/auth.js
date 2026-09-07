import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'development-only-secret-change-me';

/**
 * Signs a user object into a JWT.
 * @param {Object} user User object
 * @returns {string} JWT token
 */
export const sign = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, restaurantId: user.restaurant_id || null },
    secret,
    { expiresIn: '7d' }
  );
};

/**
 * Middleware to authenticate a user using JWT.
 */
export function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Please choose a role to continue.' });
  }
}

/**
 * Middleware to ensure the authenticated user is a waiter or admin.
 */
export function waiter(req, res, next) {
  if (!['waiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Waiter access required.' });
  }
  next();
}
