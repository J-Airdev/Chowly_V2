# Chowly

A full-stack restaurant ordering application built for the Chowly assignment. It supports customer and waiter/admin roles, persistent menu and order data, staff assignment, complaints/ratings, and clearly labelled pretend payments.

## Features

- **Multi-restaurant** — switch between restaurants from a single interface
- **Role-based access** — customer ordering vs waiter service management, enforced server-side
- **Live menu** — food & drink categories with images and preparation times
- **Order tracking** — from placement through preparation to served
- **Staff assignment** — waiters assign chefs and bartenders to order items
- **Customer feedback** — 1–5 rating with optional complaint description
- **Simulated payments** — clearly labelled pretend payment flow

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later

### Installation

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start the development server (with auto-reload)
npm run dev
```


## Project Structure

```
chowly/
├── server.js                  # Express app entry point
├── src/
│   ├── db.js                  # SQLite connection & schema
│   ├── seed.js                # Demo data seeding
│   ├── helpers.js             # Shared query helpers
│   └── middleware/
│       └── auth.js            # JWT auth & role middleware
│   └── routes/
│       ├── auth.js            # Login, register, demo session
│       ├── menu.js            # Menu item listing
│       ├── orders.js          # CRUD orders, complaints, payments
│       ├── restaurants.js     # Restaurant listing
│       └── staff.js           # Staff listing for waiters
├── public/
│   ├── index.html             # SPA shell
│   ├── css/
│   │   └── styles.css         # Consolidated responsive styles
│   ├── js/
│   │   ├── app.js             # Entry point & initialisation
│   │   ├── api.js             # Fetch wrapper
│   │   ├── state.js           # Client-side state management
│   │   ├── utils.js           # Formatting & toast helpers
│   │   ├── navigation.js      # SPA page routing
│   │   ├── components/        # Reusable UI components
│   │   │   ├── cart.js
│   │   │   ├── menu-card.js
│   │   │   └── order-card.js
│   │   └── pages/             # Page-level views
│   │       ├── menu.js
│   │       ├── orders.js
│   │       └── order-detail.js
│   └── assets/                # Menu item images
├── package.json
├── .env.example
├── .editorconfig
├── .prettierrc
└── eslint.config.js
```

## API Endpoints

| Method   | Endpoint                        | Auth     | Description                        |
| -------- | ------------------------------- | -------- | ---------------------------------- |
| `GET`    | `/api/restaurants`              | No       | List all restaurants               |
| `GET`    | `/api/menu?restaurant=slug`     | No       | Menu items for a restaurant        |
| `POST`   | `/api/demo-session`             | No       | Get a demo JWT for a role          |
| `POST`   | `/api/auth/register`            | No       | Register a new customer            |
| `POST`   | `/api/auth/login`               | No       | Login with email & password        |
| `GET`    | `/api/staff?restaurant=slug`    | Waiter   | Staff list for a restaurant        |
| `POST`   | `/api/orders?restaurant=slug`   | Customer | Place a new order                  |
| `GET`    | `/api/orders?restaurant=slug`   | Yes      | List orders                        |
| `PATCH`  | `/api/orders/:id`               | Waiter   | Update status & staff assignments  |
| `POST`   | `/api/orders/:id/complaints`    | Customer | Submit feedback (rating 1–5)       |
| `POST`   | `/api/orders/:id/payments`      | Customer | Record pretend payment             |
| `DELETE` | `/api/orders/:id`               | Customer | Remove from customer history       |


. Build command: `npm install`
. Start command: `npm start`

> **Note:** SQLite stores data on the local filesystem. For production, either attach
> a persistent disk or migrate to PostgreSQL.

## AI Use Disclosure
