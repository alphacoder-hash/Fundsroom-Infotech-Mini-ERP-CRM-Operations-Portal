# Fundsroom ERP — Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system built for a wholesale/distribution company. Covers customer management, product inventory, stock movements, and sales challans with role-based access control.

---

## Live URLs

| Service  | URL |
|----------|-----|
| Frontend | https://fundsroom-infotech-mini-erp-crm-ope-five.vercel.app |
| Backend API | https://fundsroom-backend-9cqq.onrender.com |
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
| `AWS_REGION`   | AWS region for S3 bucket           | `ap-south-1`                   |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key            | `<your_access_key_id>`         |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key        | `<your_secret_access_key>`     |
| `AWS_S3_BUCKET` | S3 bucket name for product images | `fundsroom-products`           |

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

## UI Documentation

### Design System
- **No UI framework** — fully custom CSS with CSS variables (design tokens)
- **Font**: Inter (Google Fonts)
- **Color palette**: Indigo primary, semantic green/amber/red for status badges
- **Dark sidebar** (`#1c1c2e`) + light content area (`#f4f6fb`)
- **Responsive**: Mobile-first with hamburger sidebar toggle on screens < 768px

### Pages & Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Home / Landing page | Public |
| `/login` | Login page | Public |
| `/app/dashboard` | Dashboard with stats | All roles |
| `/app/customers` | Customer list | All roles |
| `/app/customers/:id` | Customer detail + notes | All roles |
| `/app/products` | Product list + stock | All roles |
| `/app/challans` | Challan list | All roles |
| `/app/challans/:id` | Challan detail + actions | All roles |

### Layout
- **Sidebar** (240px, fixed) — logo, navigation links, user info, logout
- **Topbar** (60px, sticky) — page title, role badge, hamburger on mobile
- **Page content** — padded main area with cards
- Sidebar auto-closes on mobile when a nav item is clicked

### UI Components

**Cards** — white surface with border and shadow, used for all content sections

**Stat Cards** — dashboard overview cards with colored left border, icon, value and label. Clickable to navigate to the relevant module.

**Badges** — pill-shaped status indicators:
- `badge-success` — green (Active, Confirmed, IN)
- `badge-warning` — amber (Lead, Draft)
- `badge-danger` — red (Inactive, Cancelled, OUT, low stock)
- `badge-info` — blue (Retail)
- `badge-default` — grey (Wholesale, role labels)

**Modals** — centered overlay with backdrop blur, slide-up animation. Used for Add/Edit forms and stock movement log.

**Tables** — full-width with sticky header, hover highlight, responsive horizontal scroll wrapper.

**Forms** — labeled inputs with uppercase letter-spaced labels, focus ring on active, red border + message on error.

**Buttons**:
- `btn-primary` — dark fill, used for main actions
- `btn-secondary` — outlined, used for secondary actions
- `btn-success` — green, used for confirm actions
- `btn-danger` — red, used for cancel/delete actions
- `btn-sm` — smaller padding variant

**Banners** — full-width inline alerts (success/warning/danger) shown inside cards for contextual feedback.

**Pagination** — prev/next buttons with current page indicator and total count.

**Empty States** — centered icon + message shown when a list has no data.

**Loading** — centered spinner shown while API calls are in progress.

### Page-by-Page UI Flow

**Login Page**
- Centered card with logo, email + password fields
- Shows error message on invalid credentials
- Redirects to `/app/dashboard` on success

**Dashboard**
- 4 stat cards: Total Customers, Products, Challans, Low Stock Alerts
- Quick Actions panel — buttons to navigate to each module
- Role Permissions panel — highlights the current user's role

**Customers Page**
- Search bar (name / mobile / business)
- Filter dropdowns for Status and Type
- Table with name, mobile, business, type, status, follow-up date
- Overdue follow-up dates highlighted in red
- Add / Edit via modal (Admin + Sales only)
- View button navigates to customer detail

**Customer Detail Page**
- Full customer info grid
- Follow-up notes panel — add timestamped notes (Ctrl+Enter shortcut)
- Recent challans table linked to challan detail
- Edit button opens pre-filled modal

**Products Page**
- Search bar (name / SKU) + category filter
- Table with product image thumbnail, name, SKU, category, price, stock, location
- Low stock badge with ⚠️ when `currentStock <= minStockAlert`
- Stock IN/OUT modal with live preview of stock after update
- Stock Movement Log modal with full history
- Product image upload (JPEG/PNG/WebP, max 5MB) stored on AWS S3
- Add / Edit via modal (Admin + Warehouse only)

**Challans Page**
- Filter by status (Draft / Confirmed / Cancelled)
- Table with challan number, customer, items count, total qty, total amount, status, created by, date
- Create Challan modal:
  - Select customer dropdown
  - Dynamic product rows (add/remove)
  - Live stock availability check per row
  - Live subtotal and grand total calculation
  - Save as Draft or Confirmed
- Warning shown when confirming (stock will be deducted)

**Challan Detail Page**
- Full challan info grid (number, status, customer, created by, dates, totals)
- Products table with snapshots (name, SKU, unit price, qty, subtotal)
- Confirm / Cancel buttons (Draft only, Admin + Sales only)
- Export PDF button — generates a formatted A4 PDF invoice via `pdf-lib`
- Status banners (confirmed / cancelled / draft)

### Responsive Behaviour
- **Desktop (> 768px)**: Sidebar always visible, full table layout
- **Mobile (≤ 768px)**: Sidebar hidden, hamburger button in topbar toggles it, dark overlay behind sidebar, detail grids collapse to single column

---


A Postman collection is included at the root of the repository:

```
Fundsroom-ERP-CRM.postman_collection.json
```

Import it into Postman and set the `base_url` variable to `http://localhost:5000/api`.

---

## Bonus Features

| Feature | Status | Details |
|---|---|---|
| Docker setup | ✅ Done | Multi-stage `Dockerfile` in `backend/` |
| GitHub Actions CI/CD | ✅ Done | `.github/workflows/deploy.yml` — auto deploy on push to main |
| Export invoice as PDF | ✅ Done | A4 PDF generated via `pdf-lib` on Challan Detail page |
| Upload product image to AWS S3 | ✅ Done | S3 bucket `fundsroom-products` in `eu-north-1` |

---

## Known Limitations

- Purchase Orders module not yet implemented
- Input validation uses manual checks — Zod schema validation not yet wired up
- No refresh token — JWT expires after 24h and user must log in again
- Challan cancellation does not restore stock (business decision — can be changed)

---

## Assumptions

- One user per role for demo purposes (seeded via `npm run seed`)
- Challan cancellation does not restore stock (business decision — can be changed)
- Product prices on challan are snapshotted at creation time, not live prices
- GST number is optional for all customer types

---

## Submission Checklist

| Requirement | Status |
|---|---|
| GitHub repository | ✅ https://github.com/alphacoder-hash/Fundsroom-Infotech-Mini-ERP-CRM-Operations-Portal |
| Live frontend URL | ✅ https://fundsroom-infotech-mini-erp-crm-ope-five.vercel.app |
| Live backend API URL | ✅ https://fundsroom-backend-9cqq.onrender.com |
| Test credentials for all roles | ✅ See Test Credentials section above |
| Postman collection | ✅ `Fundsroom-ERP-CRM.postman_collection.json` at repo root |
| README with setup + deployment | ✅ This file |
| Architecture explanation | ✅ See Architecture section above |
| Known limitations | ✅ See Known Limitations section above |
