import bcrypt from 'bcryptjs';
import db from './db.js';

/**
 * Seeds the database with initial data for development/testing.
 */
export function seed() {
  const restaurant = db.prepare('INSERT OR IGNORE INTO restaurants (name,slug,location,email,restaurant_type) VALUES (?,?,?,?,?)');
  restaurant.run('The Bukka', 'the-bukka', 'Victoria Island, Lagos', 'contact@thebukka.com', 'Nigerian cuisine');
  restaurant.run('JJ Kitchen', 'jj-kitchen', 'Ikeja, Lagos', 'contact@jjkitchen.com', 'Continental & Nigerian');

  const bukka = db.prepare("SELECT * FROM restaurants WHERE slug='the-bukka'").get();
  const jj = db.prepare("SELECT * FROM restaurants WHERE slug='jj-kitchen'").get();

  db.prepare('UPDATE menu_items SET restaurant_id=? WHERE restaurant_id IS NULL').run(bukka.id);
  db.prepare('UPDATE staff SET restaurant_id=? WHERE restaurant_id IS NULL').run(bukka.id);
  db.prepare('UPDATE orders SET restaurant_id=? WHERE restaurant_id IS NULL').run(bukka.id);

  if (!db.prepare('SELECT COUNT(*) AS total FROM users').get().total) {
    const user = db.prepare('INSERT INTO users (name,email,password_hash,role,restaurant_id) VALUES (?,?,?,?,?)');
    user.run('Bukka Waiter', 'waiter@chowly.test', bcrypt.hashSync('waiter123', 10), 'waiter', bukka.id);
    user.run('Demo Customer', 'customer@chowly.test', bcrypt.hashSync('customer123', 10), 'customer', null);
  }

  db.prepare("UPDATE users SET restaurant_id=? WHERE email='waiter@chowly.test' AND restaurant_id IS NULL").run(bukka.id);
  db.prepare('INSERT OR IGNORE INTO users (name,email,password_hash,role,restaurant_id) VALUES (?,?,?,?,?)').run('JJ Kitchen Waiter', 'waiter@jjkitchen.test', bcrypt.hashSync('waiter123', 10), 'waiter', jj.id);

  if (!db.prepare('SELECT COUNT(*) AS total FROM menu_items WHERE restaurant_id=?').get(bukka.id).total) {
    const add = db.prepare('INSERT INTO menu_items (restaurant_id,name,category,description,price_cents,prep_minutes) VALUES (?,?,?,?,?,?)');
    [
      ['Jollof Rice & Chicken', 'food', 'Smoky jollof rice, grilled chicken and plantain.', 4500, 25],
      ['Suya Beef Bowl', 'food', 'Spiced beef strips, rice, onions and fresh salad.', 5200, 20],
      ['Vegetable Pasta', 'food', 'Creamy pasta with colourful seasonal vegetables.', 3900, 18],
      ['Peppered Fish', 'food', 'Whole grilled fish with bright pepper sauce.', 6500, 30],
      ['White rice and stew', 'food', 'Fluffy white rice served with rich tomato chicken stew, sweet plantains and boiled egg.', 4000, 20],
      ['Yam Porridge', 'food', 'Traditional mashed yam pottage cooked in seasoned palm oil sauce with tender beef.', 3800, 25],
      ['Chapman', 'drink', 'Citrus, grenadine and bitters over ice.', 1800, 5],
      ['Zobo Cooler', 'drink', 'Hibiscus, ginger and pineapple refresher.', 1200, 5],
      ['Fresh Lemonade', 'drink', 'Fresh lemon and mint.', 1500, 5],
      ['Malt', 'drink', 'Chilled non-alcoholic malt drink.', 1000, 2],
      ['Coke', 'drink', 'Chilled classic Coca-Cola glass bottle.', 600, 2],
      ['Fanta', 'drink', 'Chilled sparkling orange soda.', 600, 2]
    ].forEach(row => add.run(bukka.id, ...row));
  }

  const addBukkaMenu = db.prepare('INSERT INTO menu_items (restaurant_id,name,category,description,price_cents,prep_minutes) VALUES (?,?,?,?,?,?)');
  const bukkaMenuExists = db.prepare('SELECT id FROM menu_items WHERE restaurant_id=? AND name=?');
  [
    ['White rice and stew', 'food', 'Fluffy white rice served with rich tomato chicken stew, sweet plantains and boiled egg.', 4000, 20],
    ['Yam Porridge', 'food', 'Traditional mashed yam pottage cooked in seasoned palm oil sauce with tender beef.', 3800, 25],
    ['Coke', 'drink', 'Chilled classic Coca-Cola glass bottle.', 600, 2],
    ['Fanta', 'drink', 'Chilled sparkling orange soda.', 600, 2]
  ].forEach(item => {
    if (!bukkaMenuExists.get(bukka.id, item[0])) addBukkaMenu.run(bukka.id, ...item);
  });

  if (!db.prepare('SELECT COUNT(*) AS total FROM menu_items WHERE restaurant_id=?').get(jj.id).total) {
    const add = db.prepare('INSERT INTO menu_items (restaurant_id,name,category,description,price_cents,prep_minutes,image_url) VALUES (?,?,?,?,?,?,?)');
    [
      ['Ofada Rice', 'food', 'Local rice with rich ayamase sauce.', 4800, 28, '/assets/ofada-rice.png']
    ].forEach(row => add.run(jj.id, ...row));
  }

  const addJjMenu = db.prepare('INSERT INTO menu_items (restaurant_id,name,category,description,price_cents,prep_minutes) VALUES (?,?,?,?,?,?)');
  const jjMenuExists = db.prepare('SELECT id FROM menu_items WHERE restaurant_id=? AND name=?');
  [
    ['Pounded Yam & Egusi Soup (with Goat Meat)', 'food', 'Pounded yam served with rich egusi soup and tender goat meat.', 5000, 30],
    ['Amala & Ewedu (with Cow Meat)', 'food', 'Soft amala with ewedu soup and savoury cow meat.', 3500, 25],
    ['Eba and afang soup', 'food', 'Traditional yellow eba paired with rich, aromatic afang soup and tender meats.', 4500, 25],
    ['Jollof Rice and chicken', 'food', 'Smoky party jollof rice served with juicy seasoned roasted chicken.', 4500, 20],
    ['Ewa-agoyi with fresh baked bread', 'food', 'Slow-cooked mashed beans topped with spicy aganyin pepper sauce and soft freshly baked bread.', 3000, 15],
    ['Pineapple and bananna smoothie', 'drink', 'Refreshing tropical blend of fresh sweet pineapple and creamy banana.', 2500, 8],
    ['Watermelon smoothie', 'drink', 'Crisp, chilled crushed watermelon infused with a refreshing splash of lime.', 2200, 6],
    ['Tigernut smoothie', 'drink', 'Creamy traditional chilled tigernut milk blend infused with dates and coconut.', 2500, 7]
  ].forEach(item => {
    if (!jjMenuExists.get(jj.id, item[0])) addJjMenu.run(jj.id, ...item);
  });

  db.prepare("DELETE FROM menu_items WHERE restaurant_id=? AND name IN ('Virgin Mojito', 'Fanta')").run(jj.id);

  db.prepare("UPDATE menu_items SET image_url='/assets/ofada-rice.png' WHERE name='Ofada Rice' AND (image_url IS NULL OR image_url='')").run();
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/jollof-rice-chicken.png', bukka.id, 'Jollof Rice & Chicken');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/suya-beef-bowl.png', bukka.id, 'Suya Beef Bowl');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/vegetable-pasta.png', bukka.id, 'Vegetable Pasta');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/peppered-fish.png', bukka.id, 'Peppered Fish');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/chapman.png', bukka.id, 'Chapman');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/zobo-cooler.png', bukka.id, 'Zobo Cooler');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/fresh-lemonade.png', bukka.id, 'Fresh Lemonade');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/malt.png', bukka.id, 'Malt');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/white-rice-stew.png', bukka.id, 'White rice and stew');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/yam-porridge.png', bukka.id, 'Yam Porridge');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/coke.png', bukka.id, 'Coke');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/fanta.png', bukka.id, 'Fanta');

  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/pounded-yam-egusi.png', jj.id, 'Pounded Yam & Egusi Soup (with Goat Meat)');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/amala-ewedu.png', jj.id, 'Amala & Ewedu (with Cow Meat)');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/eba-afang-soup.png', jj.id, 'Eba and afang soup');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/jollof-rice-chicken-jj.png', jj.id, 'Jollof Rice and chicken');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/pineapple-banana-smoothie.png', jj.id, 'Pineapple and bananna smoothie');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/watermelon-smoothie.png', jj.id, 'Watermelon smoothie');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/tigernut-smoothie.png', jj.id, 'Tigernut smoothie');
  db.prepare('UPDATE menu_items SET image_url=? WHERE restaurant_id=? AND name=?').run('/assets/ewa-agoyi-bread.png', jj.id, 'Ewa-agoyi with fresh baked bread');

  db.prepare('UPDATE menu_items SET available=0 WHERE restaurant_id=? AND name=?').run(jj.id, 'Chicken Shawarma');

  if (!db.prepare('SELECT COUNT(*) AS total FROM staff WHERE restaurant_id=?').get(bukka.id).total) {
    const add = db.prepare('INSERT INTO staff (restaurant_id,name,role,phone_number) VALUES (?,?,?,?)');
    [
      ['Chef Amaka', 'chef', '0801 111 2222'],
      ['Chef Tunde', 'chef', '0801 111 3333'],
      ['Bartender Zainab', 'bartender', '0801 111 4444'],
      ['Bartender Kola', 'bartender', '0801 111 5555']
    ].forEach(row => add.run(bukka.id, ...row));
  }

  if (!db.prepare('SELECT COUNT(*) AS total FROM staff WHERE restaurant_id=?').get(jj.id).total) {
    const add = db.prepare('INSERT INTO staff (restaurant_id,name,role,phone_number) VALUES (?,?,?,?)');
    [
      ['Chef Ifeoma', 'chef', '0801 222 3333'],
      ['Bartender David', 'bartender', '0801 222 4444']
    ].forEach(row => add.run(jj.id, ...row));
  }
}
