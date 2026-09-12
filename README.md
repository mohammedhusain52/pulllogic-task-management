# Pull Logic — Operations Dashboard

A private, production-ready operational command center designed for **Mohammed Husain**, Senior Data Scientist at **Pull Logic**.

---

## 🚀 Overview

The **Pull Logic Operations Dashboard** provides a centralized, high-velocity platform to manage:
* **Daily Work & Prioritized Tasks**
* **Recurring Data & ML Workflows** (e.g. CNH Demand Forecast, Yanmar Sales & Inventory)
* **Client Operations Hub** (Yanmar, CNH, Zonar)
* **Visual DEV → QA → PROD Stage Progression & Dependency Gating**
* **Automated Follow-up Threshold Alerts** (for tasks waiting >1 day)
* **Live Team Workload & Time Tracking** (Bhavish, Anuj & engineers)
* **Dedicated Bugs, Operational Issues, and Features Tracking**
* **Monthly & Weekly Operational Calendar**
* **Operational Velocity & Bottleneck Reports**

---

## 🛠 Technology Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (Dark Operations Command Center theme, Glassmorphism, Micro-animations)
- **Database & ORM**: Prisma ORM with SQLite for zero-config local development and instant migration to PostgreSQL (Supabase / Neon / Vercel Postgres) in production
- **Icons & UI**: Lucide React, Radix primitives, Canvas Confetti
- **Testing**: Vitest unit and integration test suite

---

## 📦 Project Structure

```text
├── prisma/
│   ├── schema.prisma        # Normalized relational schema
│   └── seed.ts              # Seed script (Yanmar, CNH, Zonar, Bhavish, Anuj, etc.)
├── src/
│   ├── app/
│   │   ├── api/             # RESTful API endpoints (dashboard, tasks, workflows, team, clients, time, upload, reports, settings, export)
│   │   ├── bugs/            # Bugs & Defect Operations tracker
│   │   ├── calendar/        # Operations calendar (monthly/weekly views)
│   │   ├── clients/         # Client profiles and account dashboards
│   │   ├── features/        # Features roadmap & capability tracker
│   │   ├── issues/          # Operational and technical blockers tracker
│   │   ├── reports/         # Velocity and bottleneck analytics
│   │   ├── settings/        # System configuration & JSON backup export
│   │   ├── tasks/           # Tasks list and interactive Kanban board
│   │   ├── team/            # Team workload & capacity management
│   │   ├── workflows/       # Workflow runs, visual pipeline, and builder
│   │   ├── globals.css      # Custom design tokens, glassmorphism, scrollbars
│   │   └── page.tsx         # Primary Operations Command Center dashboard
│   ├── components/
│   │   ├── dashboard/       # Summary cards, Follow-up alerts, My Work Today, Team overview
│   │   ├── layout/          # Header, Sidebar, MobileNav, AppLayout
│   │   └── modals/          # QuickAddModal, RunWorkflowModal, GlobalSearchModal, TaskDetailDrawer
│   ├── lib/
│   │   ├── db.ts            # Prisma singleton client
│   │   ├── utils.ts         # Formatting, status badges, durations
│   │   └── services/        # Domain engines (workflowService, taskService, followUpService, timeTrackingService, activityService)
│   └── __tests__/           # Vitest automated test suite
```

---

## ⚡ Getting Started Locally

### 1. Prerequisites
- Node.js >= 18
- npm

### 2. Installation
```bash
npm install
```

### 3. Initialize Database & Seed
```bash
npm run db:push
npm run db:seed
```

### 4. Run Automated Tests
```bash
npm run test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 Seeded Workflows & Data

1. **Yanmar Sales** (Monthly):
   - **DEV Stage**: Receive Sales File → Upload S3 → Validate Data → Load DB → Run Demand Forecast → Trigger Lambda → DEV Testing (currently waiting on Testing Team)
   - **QA Stage**: Locked until DEV testing completes (QA Prep → QA Testing)
   - **PROD Stage**: Locked until QA completes (PROD Prep → PROD Testing → Final Confirmation)

2. **Yanmar CountyMarket** (Monthly / Manual):
   - Independent DEV → QA → PROD file ingestion and confirmation stages.

3. **Yanmar Inventory** (Weekly / PROD-only):
   - 12 sequential/parallel tasks: OpenOrders generation, Wells Fargo, NorthPoint, RDC inventory sources, and ParModel execution.

4. **CNH Demand Forecast** (Recurring: First Thursday of month):
   - Assigned to **Bhavish**.

5. **Zonar Telematics Modules**:
   - Module A (Anomaly scoring) & Module B (Sensor sync), assigned to **Anuj**.

---

## 🚀 Deployment to Vercel & Production Database

### PostgreSQL Migration
To deploy to Vercel with PostgreSQL (Supabase, Neon, or Vercel Postgres):
1. In `prisma/schema.prisma`, change datasource provider from `"sqlite"` to `"postgresql"`.
2. Configure your `.env.production` or Vercel Environment Variables:
```ini
DATABASE_URL="postgresql://user:password@host:5432/pulllogic_db?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/pulllogic_db"

# Optional Cloud Storage (S3 / Cloudflare R2 / AWS)
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_ACCESS_KEY="your-key"
S3_SECRET_KEY="your-secret"
S3_BUCKET="pulllogic-attachments"
S3_REGION="auto"
```
3. Run `npx prisma db push && npx prisma db seed` on your database instance.
4. Deploy to Vercel with standard Next.js build command (`next build`).
