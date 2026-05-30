# ShadowQuant Dynamics – Internship Tracking Management System (ITMS)

Welcome to **ShadowQuant Dynamics – Internship Tracking Management System (ITMS)**, a production-grade full-stack SaaS platform designed for tracking, managing, and evaluating student internships.

This monorepo houses a Node.js + Express backend powered by Prisma ORM over SQLite, and a highly interactive, responsive React 18 frontend built with Vite, Tailwind CSS, Framer Motion, and TanStack Query.

---

## ═══════════════════════════════════════════════════════
##  TECH STACK SUMMARY
## ═══════════════════════════════════════════════════════

### Backend Components
- **Node.js 20 + Express 4**: REST APIs with central modular routers.
- **SQLite (via Prisma ORM)**: Zero-installation database on disk (`dev.db`).
- **JWT Auth**: Access token rotating every 15 minutes, with secure 7-day refresh token rotation.
- **Local File Serving**: Photo uploads saved to `/uploads` and statically served on port 5000.
- **Rate-limit & Security**: Helmet, CORS policies, Express Morgan logging, and authentication rate limits (15 attempts/min).

### Frontend Components
- **React 18 (Vite)**: client-side build with 100% functional components.
- **React Router v6**: Client-side protected and nested routing layouts.
- **Tailwind CSS v3**: custom fintech surface palettes supporting light/dark toggling.
- **Framer Motion**: micro-interactions (clicking tap-shrink, hover expansions) and staggered page load sliders.
- **Axios Client**: request token injectors and queued response retries upon token expiration (401).
- **TanStack React Query**: server state caching, invalidations, and shimmering skeletons loaders.
- **Recharts**: animated line, bar, and pie charts.
- **React Hook Form + Zod**: client-side validation logic.

---

## ═══════════════════════════════════════════════════════
##  SETUP & RUNNING INSTRUCTIONS
## ═══════════════════════════════════════════════════════

The project is structured as an **npm workspaces monorepo**. You can manage both frontend and backend directories straight from the root folder.

### 1. Install Dependencies
Run the standard package installation from the root directory:
```bash
npm install
```
*(This will automatically resolve and install dependencies for the root, backend, and frontend workspaces.)*

### 2. Run Database Migrations
Generate the SQLite database file and migrate the tables:
```bash
npm run prisma:migrate
```

### 3. Seed Database Records
Seed the SQLite database with default administrators, students, applications, logs, and notification feeds:
```bash
npm run prisma:seed
```

### 4. Launch Development Servers
Run the concurrently development script from the root workspace:
```bash
npm run dev
```
- **Backend API**: Running on `http://localhost:5000`
- **Frontend App**: Running on `http://localhost:5173`

---

## ═══════════════════════════════════════════════════════
##  TEST CREDENTIALS & CREDENTIALS
## ═══════════════════════════════════════════════════════

Login to the platform using our dynamically seeded database records:

### 1. Lead ITMS Administrator Role
- **Email**: `admin@shadowquant.io`
- **Password**: `Admin@1234`
- **Dashboards**: Manage Users deactivations, Internships CRUD modal postings, Applications stage timeline selectors, and Pending daily logs approvals.

### 2. Aarav Sharma (CS IIT Student) Role
- **Email**: `student1@test.com`
- **Password**: `Test@1234`
- **Dashboards**: Hired placement indicator milestone timer, weekly shifts Recharts BarChart logs, Explore internships skill overlap matches, daily log clock-in/out hour calculation grids, and tag skill collections.

### 3. Ishita Patel (BITS Student) Role
- **Email**: `student2@test.com`
- **Password**: `Test@1234`

### 4. Kabir Mehta (DTU Student) Role
- **Email**: `student3@test.com`
- **Password**: `Test@1234`

---

## ═══════════════════════════════════════════════════════
##  MONOREPO LAYOUT
## ═══════════════════════════════════════════════════════

```
/itms-root
├── /backend
│   ├── /prisma
│   │   ├── schema.prisma (SQLite database schema definition)
│   │   └── seed.js       (Seeding script containing 1 admin + 3 students + 5 internships)
│   ├── /src
│   │   ├── /config       (db.js, cloudinary.js, jwt.js)
│   │   ├── /middleware   (auth.js, roleGuard.js, errorHandler.js, validate.js)
│   │   └── /modules
│   │       ├── /auth     (routers, controllers, service layers)
│   │       ├── /users    (profile patches, avatars, notifications)
│   │       ├── ...
│   │       └── /admin    (locks toggles, pending logs, audits)
│   ├── server.js
│   └── package.json
│
├── /frontend
│   ├── /src
│   │   ├── /api          (Axios clients, endpoints wrappers)
│   │   ├── /components
│   │   │   ├── /ui       (Button, Input, Modal, Badge, Skeleton, Avatar)
│   │   │   ├── /layout   (Sidebar, Topbar, PageWrapper)
│   │   │   └── /shared   (StatCard, DataTable, EmptyState, ErrorBoundary)
│   │   ├── /pages
│   │   │   ├── /auth     (LoginPage, SignupPage)
│   │   │   ├── /student  (Dashboard, Explore, Applications, DailyLogs, Profile)
│   │   │   └── /admin    (AdminDashboard, Users, Internships, Applications, DailyLogs)
│   │   ├── /store        (AuthContext useReducer global state)
│   │   ├── /utils        (formatDate, computeHours, exportCSV, cn)
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
│
├── /uploads              (Statically served local profile avatar uploads folder)
└── package.json          (Root workspaces runner)
```
