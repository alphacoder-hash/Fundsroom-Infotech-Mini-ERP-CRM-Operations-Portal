# Fundsroom ERP — Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system built for a wholesale/distribution company. Covers customer management, product inventory, stock movements, and sales challans with role-based access control.

---

## Live URLs

| Service  | URL |
|----------|-----|
| Frontend | _To be deployed_ |
| Backend API | _To be deployed_ |
| Database | Supabase PostgreSQL (hosted) |

---

## Test Credentials

All accounts use the password: `Admin@123`

| Role      | Email                        |
|-----------|------------------------------|
| Admin     | admin@fundsroom.com          |
| Sales     | sales@fundsroom.com          |
| Warehouse | warehouse@fundsroom.com      |
| Accounts  | accounts@fundsroom.com       |

---

## Tech Stack

### Backend
- Node.js + TypeScript
- Express.js v5
- PostgreSQL (via Supabase)
- Prisma ORM
- JWT Authentication
- bcrypt for password hashing

### Frontend
- React 19 + TypeScript
- Vite
- React Router v7
- Axios
- Custom CSS (no UI framework)

---

## Architecture

```
Fundsroom ERP/
├── backend/                  # Express API server
│   ├── prisma/
│   │   └── schema.prisma     # DB schema (User, Customer, Product, SalesChallan, StockMovement)
│   └── src/
│       ├── controllers/      # Business logic per module
│       ├── middleware/        # JWT auth + error handler
│       ├── routes/           # Route definitions
│       ├── prismaClient.ts   # Prisma singleton
│       ├── seed.ts           # Seed users + demo data
│       └── server.ts         # Express app entry point
└── frontend/                 # React SPA
    └── src/
        ├── components/       # Layout (sidebar + topbar)
        ├── context/          # AuthContext (JWT + user state)
        ├── pages/            # One file per page/module
        └── config.ts         # Axios instance with interceptors
```

### Role Permissions

| Role      | Customers     | Products/Stock | Challans      |
|-----------|---------------|----------------|---------------|
| ADMIN     | Read + Write  | Read + Write   | Read + Write  |
| SALES     | Read + Write  | Read only      | Read + Write  |
| WAREHOUSE | Read only     | Read + Write   | Read only     |
| ACCOUNTS  | Read only     | Read only      | Read only     |

---

## Core Modules

### 1. Authentication
- JWT-based login with 24h token expiry
- Role-based middleware on all protected routes
- Token stored in localStorage, auto-attached via Axios interceptor
- Auto-redirect to `/login` on 401

### 2. Customer CRM
- Full CRUD with fields: name, mobile, email, business name, GST, type, address, status, follow-up date, notes
- Search by name / mobile / business name
- Filter by status (Lead / Active / Inactive)
- Follow-up notes appended with timestamp on customer detail page
- Pagination on list view

### 3. Product & Inventory
- Full CRUD with fields: name, SKU, category, unit price, current stock, min stock alert, location
- Stock IN/OUT movements with reason and created-by tracking
- Atomic transactions — stock update + movement log in one DB transaction
- Low stock alert badge when `currentStock <= minStockAlert`
- Stock movement log modal per product

### 4. Sales Challan
- Select customer + add multiple products with quantities
- Auto-generated challan number: `CH-YYYY-XXXXX`
- Save as Draft (no stock change) or Confirmed (deducts stock atomically)
- Product snapshot stored at time of challan (name, SKU, price)
- Stock cannot go negative — API returns proper error
- Confirm / Cancel from challan detail page
- Status flow: `DRAFT → CONFIRMED` or `DRAFT → CANCELLED`

---

## Local Setup

### Prerequisites
- Node.js v18+
- npm v9+
- PostgreSQL database (or use the Supabase URL below)

### 1. Clone the repository

```bash
git clone https://github.com/alphacoder-hash/Fundsroom-Infotech-Mini-ERP-CRM-Operations-Portal.git
cd Fundsroom-Infotech-Mini-ERP-CRM-Operations-Portal
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_jwt_secret_key"
PORT=5000
```

Run database migrations:

```bash
npx prisma migrate deploy
```

Seed the database with users and demo data:

```bash
npm run seed
```

Start the development server:

```bash
npm run dev
```

Backend runs on: `http://localhost:5000`

Health check: `GET http://localhost:5000/health`

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                        | Example                        |
|----------------|------------------------------------|--------------------------------|
| `DATABASE_URL` | PostgreSQL connection string       | `postgresql://user:pass@host/db` |
| `JWT_SECRET`   | Secret key for signing JWT tokens  | `your_secret_key`              |
| `PORT`         | Port for the Express server        | `5000`                         |
| `CORS_ORIGIN`  | Allowed frontend origin            | `http://localhost:5173`        |

### Frontend (`frontend/.env`)

| Variable        | Description              | Example                        |
|-----------------|--------------------------|--------------------------------|
| `VITE_API_URL`  | Backend API base URL     | `http://localhost:5000/api`    |

---

## API Overview

### Auth
| Method | Endpoint         | Access  | Description        |
|--------|------------------|---------|--------------------|
| POST   | /api/auth/login  | Public  | Login, returns JWT |
| GET    | /api/auth/me     | All     | Get current user   |

### Customers
| Method | Endpoint                    | Access         | Description           |
|--------|-----------------------------|----------------|-----------------------|
| GET    | /api/customers              | All            | List with pagination  |
| GET    | /api/customers/:id          | All            | Customer detail       |
| POST   | /api/customers              | Admin, Sales   | Create customer       |
| PUT    | /api/customers/:id          | Admin, Sales   | Update customer       |
| POST   | /api/customers/:id/notes    | Admin, Sales   | Add follow-up note    |

### Products
| Method | Endpoint                        | Access             | Description           |
|--------|---------------------------------|--------------------|-----------------------|
| GET    | /api/products                   | All                | List with pagination  |
| GET    | /api/products/:id               | All                | Product detail        |
| POST   | /api/products                   | Admin, Warehouse   | Create product        |
| PUT    | /api/products/:id               | Admin, Warehouse   | Update product        |
| POST   | /api/products/:id/stock         | Admin, Warehouse   | Stock IN/OUT          |
| GET    | /api/products/:id/movements     | All                | Stock movement log    |

### Challans
| Method | Endpoint                    | Access         | Description           |
|--------|-----------------------------|----------------|-----------------------|
| GET    | /api/challans               | All            | List with pagination  |
| GET    | /api/challans/:id           | All            | Challan detail        |
| POST   | /api/challans               | Admin, Sales   | Create challan        |
| PATCH  | /api/challans/:id/status    | Admin, Sales   | Confirm or Cancel     |

---

## Deployment

### Free Deployment (Recommended)

**Database** — Already on Supabase (PostgreSQL, hosted)

**Backend** — Deploy to [Render](https://render.com)
1. Create a new Web Service
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`

**Frontend** — Deploy to [Vercel](https://vercel.com)
1. Import your GitHub repo
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL` = your Render backend URL

### AWS Deployment (Bonus)
- EC2 (t2.micro free tier) for backend
- S3 + CloudFront for frontend static hosting
- RDS PostgreSQL or keep Supabase

---

## Postman Collection

A Postman collection is included at the root of the repository:

```
Fundsroom-ERP-CRM.postman_collection.json
```

Import it into Postman and set the `base_url` variable to `http://localhost:5000/api`.

---

## Known Limitations

- Purchase Orders module not yet implemented
- Invoice generation not yet implemented
- Mobile sidebar requires hamburger toggle (currently hidden on small screens)
- Input validation uses manual checks; Zod schema validation not yet wired up
- No refresh token — JWT expires after 24h and user must log in again

---

## Assumptions

- One user per role for demo purposes (seeded via `npm run seed`)
- Challan cancellation does not restore stock (business decision — can be changed)
- Product prices on challan are snapshotted at creation time, not live prices
- GST number is optional for all customer types
