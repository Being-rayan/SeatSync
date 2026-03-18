# SeatSync

SeatSync is a full-stack web application for verified digital seat exchanges between passengers sharing the same train coach or bus. It uses journey verification, JWT authentication, PostgreSQL-backed mock travel records, two-phase consent, polling-based live updates, and an admin oversight console.

Tagline: `Verified digital seat swaps for shared journeys.`

## Features

- Passenger registration, login, logout, and JWT-protected routes
- Password hashing with `bcrypt`
- Journey verification against seeded PostgreSQL records
- Interactive train and bus seat maps
- Polling-based live updates for seats, requests, and notifications
- Structured swap workflow:
  - request
  - accept
  - final confirmation by both passengers
  - seat reassignment only after dual consent
- Request statuses: `pending`, `accepted`, `rejected`, `expired`, `completed`, `cancelled`
- In-app notifications and audit logging
- Admin analytics, seat lock/unlock controls, journey tables, and swap monitoring
- Demo seed data for 2 train journeys and 2 bus journeys
- Basic backend tests for auth, verification, swap creation, duplicate prevention, final confirmation, and auth rejection

## Tech Stack

### Frontend

- React
- React Router DOM
- Axios
- HTML
- CSS
- JavaScript
- Vite

### Backend

- Node.js
- Express.js
- PostgreSQL
- `pg`
- `jsonwebtoken`
- `bcrypt`
- `helmet`
- `cors`

## Project Structure

```text
SeatSync/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── api/
│   ├── config/
│   ├── controllers/
│   ├── db/
│   │   └── repositories/
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── sql/
│   ├── tests/
│   ├── utils/
│   ├── .env.example
│   ├── app.js
│   ├── package.json
│   └── server.js
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## Local Setup

### 1. Create the database

Create a PostgreSQL database named `seatsync`.

Example:

```bash
createdb seatsync
```

Or in `psql`:

```sql
CREATE DATABASE seatsync;
```

### 2. Install dependencies

From the repository root:

```bash
npm install
```

Or start both the frontend and backend together with:

```bash
npm run dev
```

### 3. Environment variables

Copy the examples:

```bash
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item client\.env.example client\.env
Copy-Item server\.env.example server\.env
```

The backend will read either `server/.env` or the root `.env`, so you can keep your local PostgreSQL settings in one place if you prefer.
Update the values if your PostgreSQL credentials or frontend/backend origins differ.

### 4. Apply schema and seed demo data

```bash
npm run db:schema
npm run db:seed
```

### 5. Run the backend

```bash
npm run server:dev
```

Backend default URL:

```text
http://localhost:5000
```

### 6. Run the frontend

Open a second terminal:

```bash
npm run client:dev
```

Frontend default URL:

```text
http://localhost:5173
```

## Test Commands

Backend tests:

```bash
npm run server:test
```

Frontend production build:

```bash
npm run client:build
```

## Environment Variables

### Root / backend values

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173
DEV_MEMORY_MODE=auto
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/seatsync
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
SWAP_REQUEST_EXPIRY_MINUTES=15
```

### Frontend values

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

If `VITE_API_BASE_URL` is omitted, the client falls back to `http://<same-host>:5000/api` for common local dev ports and `/api` everywhere else.
If PostgreSQL is unavailable in local development, the backend now falls back to in-memory demo data automatically unless `DEV_MEMORY_MODE=false`.

## Demo Credentials

### Admin

- Email: `admin@seatsync.dev`
- Password: `Admin@123`

### Passengers

- `arjun@seatsync.dev / Travel@123`
- `meera@seatsync.dev / Travel@123`
- `nikhil@seatsync.dev / Travel@123`
- `rohan@seatsync.dev / Travel@123`
- `priya@seatsync.dev / Travel@123`
- `farah@seatsync.dev / Travel@123`
- `sameer@seatsync.dev / Travel@123`
- `leena@seatsync.dev / Travel@123`
- `aman@seatsync.dev / Travel@123`
- `sara@seatsync.dev / Travel@123`
- `kabir@seatsync.dev / Travel@123`

## Claimable Verification Records

Use any registered passenger account, then verify with one of these seeded records:

| Journey Type | Reference | Passenger | Date | Coach/Bus | Seat | Boarding | Destination |
|---|---|---|---|---|---|---|---|
| Train | `PNR-900111` | Ishaan Kapoor | `2026-04-22` | `S1` | `5D` | New Delhi | Bhopal |
| Train | `PNR-900112` | Kavya Iyer | `2026-04-22` | `S1` | `6A` | New Delhi | Bhopal |
| Train | `TKT-220701` | Ananya Roy | `2026-04-23` | `C2` | `3A` | Mumbai Central | Vadodara |
| Train | `TKT-220702` | Dev Malhotra | `2026-04-23` | `C2` | `4C` | Mumbai Central | Vadodara |
| Bus | `BUS-884401` | Rahul Verma | `2026-04-24` | `B7` | `2A` | Indiranagar | Electronic City |
| Bus | `BUS-884402` | Sneha Joshi | `2026-04-24` | `B7` | `2D` | Indiranagar | Electronic City |
| Bus | `BUS-990501` | Neha Arora | `2026-04-25` | `A1` | `4B` | Chennai Central | Tambaram |
| Bus | `BUS-990502` | Vikram Sethi | `2026-04-25` | `A1` | `5C` | Chennai Central | Tambaram |

## Seeded Data Highlights

- 2 train journeys and 2 bus journeys
- Train and bus seat maps with layout coordinates
- Verified passengers and unclaimed verification records
- Seeded swap requests in `pending`, `accepted`, `rejected`, `completed`, and `cancelled` states
- One admin account and multiple passenger accounts
- Notifications and audit log entries for demo visibility

## API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Journey

- `POST /api/journey/verify`
- `GET /api/journey/current`
- `GET /api/journeys/:journeyId/seats`

### Swaps

- `POST /api/swaps`
- `GET /api/swaps/incoming`
- `GET /api/swaps/outgoing`
- `GET /api/swaps/:id`
- `PATCH /api/swaps/:id/accept`
- `PATCH /api/swaps/:id/reject`
- `PATCH /api/swaps/:id/cancel`
- `PATCH /api/swaps/:id/final-confirm`

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

### Admin

- `GET /api/admin/journeys`
- `GET /api/admin/users`
- `GET /api/admin/swaps`
- `GET /api/admin/analytics`
- `GET /api/admin/seats`
- `PATCH /api/admin/seats/:id/lock`
- `PATCH /api/admin/seats/:id/unlock`

## Architecture Notes

### Backend

- `server/app.js` exports the Express app cleanly for local runtime and serverless adaptation.
- Repository modules isolate SQL from business logic.
- Service modules own rules like verification checks, duplicate swap prevention, request expiry, and final dual consent.
- Temporary swap locking is derived from active request state rather than websockets.
- Expired requests are resolved during API reads through the expiry service.

### Frontend

- React Router separates public, passenger, and admin surfaces.
- Auth state is stored with a JWT token in local storage and refreshed with `GET /auth/me`.
- Passenger pages poll the backend every few seconds for seat map, notifications, and request updates.
- Admin pages poll analytics and monitoring data on longer intervals.

## PostgreSQL Schema / Migration

- Schema file: [server/sql/schema.sql](/c:/Users/rayan/OneDrive/Desktop/SeatSync/server/sql/schema.sql)
- Seed script: [server/scripts/seed.js](/c:/Users/rayan/OneDrive/Desktop/SeatSync/server/scripts/seed.js)

Run them with:

```bash
npm run db:schema
npm run db:seed
```

## Vercel Deployment Notes

- Set `VITE_API_BASE_URL` in Vercel to the deployed backend base URL, or use `/api` if your deployment rewrites frontend requests to the backend.
- The backend is separated for independent deployment and exports the Express app via:
  - [server/app.js](/c:/Users/rayan/OneDrive/Desktop/SeatSync/server/app.js)
  - [server/api/index.js](/c:/Users/rayan/OneDrive/Desktop/SeatSync/server/api/index.js)
- For production, deploy the backend to a Node-friendly host or adapt the exported app to a serverless function target.

## Limitations

- Journey verification is mock verification against seeded PostgreSQL data, not a real railway or bus API.
- Polling simulates real-time updates but is not as immediate as websocket-based delivery.
- JWT storage is client-side for this demo setup; production hardening would usually move auth into secure HTTP-only cookies.

## Future Improvements

- Real provider integrations for live PNR or booking validation
- Fine-grained admin audit views
- Email or SMS notification hooks
- Seat preference filters beyond type and occupancy
- Serverless backend deployment templates for Vercel or similar platforms
