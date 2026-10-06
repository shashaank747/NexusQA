# NexusQA — Dual-Portal QA & Developer Hub (Connected with Supabase & Vercel)

NexusQA is a dual-role Quality Assurance and Developer collaboration platform backed by **Supabase PostgreSQL** and **Vercel**.

1. 🧪 **Tester Portal Link (`/qa` or `?role=qa`)**: Designed for QA Engineers to manage test suites, execute live runs, generate AI scenarios, and report defects.
2. 💻 **Developer Portal Link (`/dev` or `?role=dev`)**: Designed for Software Developers to triage assigned defects, inspect linked test failure steps, submit code fixes with GitHub PR/branch links, and request QA re-verification.

Both portals are connected to a shared **Supabase Cloud Database** with **PostgreSQL Realtime replication** and instant cross-tab synchronization.

---

## ⚡ 1-Minute Supabase Database Setup

To connect your Supabase database:

1. **Create a Free Supabase Project**: Go to [https://supabase.com](https://supabase.com) and create a project.
2. **Run the Database Schema**:
   - In your Supabase Dashboard, click on the **SQL Editor** tab (left sidebar).
   - Click **New query**, paste the entire contents of [`supabase_schema.sql`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/supabase_schema.sql), and click **Run**.
   - *This creates all tables (`nexus_test_cases`, `nexus_suites`, `nexus_defects`, `nexus_test_runs`, `nexus_users`) and enables Supabase Realtime.*
3. **Connect NexusQA**:
   - In Supabase, go to **Project Settings** → **API** to copy:
     - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
     - **anon public Key** (e.g., `eyJhbGciOi...`)
   - Open NexusQA, go to **Settings & Supabase**, paste your URL & Key, and click **Connect & Sync**.
   - Click **"Upload Data"** to seed your Supabase database with the initial demo dataset!

---

## 🔗 The Two Connected Links

| Portal | URL Route | Target Audience | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **QA Tester Portal** | `https://your-app.vercel.app/qa` (or `?role=qa`) | QA Engineers, Test Leads | Test Repository, Live Execution Runner, AI Scenario Generator, Defect Filing, Re-test Verification. |
| **Developer Hub** | `https://your-app.vercel.app/dev` (or `?role=dev`) | Software Developers, Tech Leads | Assigned Bug Triage Kanban, Reproduction Step Inspector, PR Linkage & Code Fix Submitter. |
| **Unified Role Gate** | `https://your-app.vercel.app/login` (or `?login=true`) | All Users | 1-click persona quick-login (`Alex Morgan - QA Lead`, `Marcus Vance - Dev Lead`) or custom sign-in. |

---

## 🔄 Real-Time Cross-Portal Workflow

1. **Tester executes a test run** and marks a test as `Failed` (e.g. `TC-104`).
2. **Tester clicks "File Bug to Dev Hub"** and submits `BUG-201`.
3. **Instantly & without refreshing**, the bug is saved in Supabase and appears on the **Developer Portal** (`/dev`) inside the **Defect Triage Kanban** column `Open / New Bugs`.
4. **Developer opens the bug**, reads the exact test steps that failed, enters their Git branch (`fix/coupon-tax-nullpointer`), PR link, and root-cause resolution notes.
5. **Developer clicks "Submit Fix & Notify QA"**, advancing the status to `Fixed - Ready for QA`.
6. **Instantly & in real-time**, the **QA Portal** receives a notification alert banner: `1 bug has been marked as Fixed & Ready for QA! Review & Re-Verify`.
7. **QA re-tests the step** and marks it `Resolved & Verified & Closed`.

---

## 🚀 Deploying to Vercel

This repository includes [`vercel.json`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/vercel.json) configured with clean rewrites for `/qa`, `/dev`, and `/login`.

### Deploy using Vercel CLI:
```bash
npx vercel
```
Or connect your GitHub repository to [Vercel Dashboard](https://vercel.com) for automatic continuous deployment.
