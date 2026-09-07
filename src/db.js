import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates and exports the better-sqlite3 database instance.
 */
const db = new Database(path.join(__dirname, '..', 'chowly.db'));

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, location TEXT, email TEXT, restaurant_type TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('customer','waiter','admin')), restaurant_id INTEGER REFERENCES restaurants(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS menu_items (id INTEGER PRIMARY KEY, restaurant_id INTEGER REFERENCES restaurants(id), name TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('food','drink')), description TEXT NOT NULL, price_cents INTEGER NOT NULL, prep_minutes INTEGER NOT NULL, image_url TEXT, available INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY, restaurant_id INTEGER REFERENCES restaurants(id), name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('chef','bartender')), phone_number TEXT);
  CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, restaurant_id INTEGER REFERENCES restaurants(id), customer_id INTEGER NOT NULL REFERENCES users(id), waiter_id INTEGER REFERENCES users(id), status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed','preparing','served','cancelled')), estimated_minutes INTEGER NOT NULL, table_number TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, served_at TEXT);
  CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, menu_item_id INTEGER NOT NULL REFERENCES menu_items(id), name TEXT NOT NULL, price_cents INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0), chef_id INTEGER REFERENCES staff(id), bartender_id INTEGER REFERENCES staff(id), status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed','preparing','served')));
  CREATE TABLE IF NOT EXISTS complaints (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), description TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE, amount_cents INTEGER NOT NULL, method TEXT NOT NULL DEFAULT 'Pretend payment', status TEXT NOT NULL DEFAULT 'paid', reference TEXT NOT NULL, paid_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);

/**
 * Ensures a column exists in a table, running ALTER TABLE if not.
 * @param {string} table The table name
 * @param {string} column The column name
 * @param {string} definition The column definition
 */
export function ensureColumn(table, column, definition) {
  if (!/^[a-zA-Z0-9_]+$/.test(table) || !/^[a-zA-Z0-9_]+$/.test(column)) {
    throw new Error('Invalid table or column name');
  }
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some(row => row.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('users', 'restaurant_id', 'INTEGER REFERENCES restaurants(id)');
ensureColumn('menu_items', 'restaurant_id', 'INTEGER REFERENCES restaurants(id)');
ensureColumn('staff', 'restaurant_id', 'INTEGER REFERENCES restaurants(id)');
ensureColumn('staff', 'phone_number', 'TEXT');
ensureColumn('orders', 'restaurant_id', 'INTEGER REFERENCES restaurants(id)');
ensureColumn('orders', 'waiter_id', 'INTEGER REFERENCES users(id)');
ensureColumn('orders', 'table_number', 'TEXT');
ensureColumn('orders', 'customer_hidden_at', 'TEXT');
ensureColumn('order_items', 'chef_id', 'INTEGER REFERENCES staff(id)');
ensureColumn('order_items', 'bartender_id', 'INTEGER REFERENCES staff(id)');
ensureColumn('order_items', 'status', "TEXT NOT NULL DEFAULT 'placed'");

export default db;
