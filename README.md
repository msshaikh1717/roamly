# Roamly API

A RESTful tour-booking API built with Node.js, Express 5, and MongoDB.

This project began as a learning exercise based on Jonas Schmedtmann's "Complete Node.js Bootcamp" and has been substantially updated to modern library versions and extended beyond the course scope. The original course uses Express 4, Mongoose 6, and ESLint 8; this project runs on Express 5, Mongoose 9, and ESLint 10.

## What Was Changed or Added

- **Express 5 migration** — configured the query parser to `'extended'` to restore bracket-notation filtering (`?price[lt]=1000`), which silently breaks under Express 5's new default `'simple'` parser.
- **Mongoose 9 migration** — resolved breaking changes in `findOneAnd*` post hook signatures, ensuring average-rating recalculation fires correctly on review updates and deletes.
- **`@exortek/express-mongo-sanitize`** in place of `express-mongo-sanitize` — the original package crashes on Express 5 due to the new immutable `req.query` behaviour.
- **Unique compound index on `{ tour, user }`** for reviews — enforced at the database layer to prevent duplicate reviews, with a documented migration procedure for adding unique constraints to existing collections.
- **ESLint 10 flat config** — the course uses the deprecated `.eslintrc` format.
- **`cross-env`** for cross-platform `NODE_ENV` handling in `start:prod`.

## Key Technical Decisions

- **JWT over sessions** — stateless authentication simplifies horizontal scaling and keeps the API decoupled from the client.
- **Factory pattern for CRUD handlers** (`handlerFactory.js`) — a single `getAll`, `getOne`, `createOne`, `updateOne`, `deleteOne` implementation reused across tours, reviews, and users.
- **Compound unique index** on reviews — enforces one review per user per tour at the database layer rather than relying on application checks.
- **Geospatial queries via `$geoNear`** — server-side distance calculations instead of client-side filtering.

## Features

- JWT authentication with a full password reset flow
- Role-based access control (`user`, `guide`, `lead-guide`, `admin`)
- Nested routes for reviews (`/tours/:tourId/reviews`)
- Geospatial queries — find tours within a given radius of a point
- Aggregation pipelines — tour statistics and monthly plans
- Centralised error handling with development vs production output
- Security: rate limiting, Helmet, HPP, Mongo sanitisation

## Local Setup

1. Clone and install:

   ```bash
   git clone https://github.com/msshaikh1717/roamly.git
   cd roamly
   npm install
   ```

2. Create `config.env` from the template:

   ```bash
   cp config.env.example config.env
   ```

   Then fill in your Atlas, JWT, and Mailtrap credentials.

3. Import development data:

   ```bash
   node dev-data/data/import-dev-data.js --import
   ```

4. Start the server:
   ```bash
   npm start
   ```

The API runs at `http://localhost:3000/api/v1/tours`.

## Postman Collection

The full API collection is in `/postman/`, including dev and prod environments.

## Tech Stack

Node.js 24 · Express 5 · MongoDB · Mongoose 9 · JWT · Nodemailer · ESLint 10
