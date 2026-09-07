import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { seed } from './src/seed.js';
import restaurantsRouter from './src/routes/restaurants.js';
import menuRouter from './src/routes/menu.js';
import authRouter from './src/routes/auth.js';
import staffRouter from './src/routes/staff.js';
import ordersRouter from './src/routes/orders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'development') {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'development') {
  console.warn('WARNING: Using default JWT secret in development mode.');
}

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', restaurantsRouter);
app.use('/api', menuRouter);
app.use('/api', authRouter);
app.use('/api', staffRouter);
app.use('/api', ordersRouter);

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

seed();

app.listen(PORT, () => {
  console.log(`Chowly running at http://localhost:${PORT}`);
});
