<div align="center">
  <img src="Glossy Neon Coding Loop Logo.png" alt="NexusQA Logo" width="110" height="110" style="border-radius: 24px; filter: drop-shadow(0 10px 25px rgba(99, 102, 241, 0.45)); margin-bottom: 12px;">
  <h1>NexusQA — Modern QA & Developer Ecosystem</h1>
  <p><strong>Next-Generation Quality Engineering & Developer Command Center powered by Supabase Realtime & Vercel</strong></p>

  <div>
    <img src="https://img.shields.io/badge/Architecture-Dual_Portal-indigo?style=for-the-badge&logo=react" alt="Architecture">
    <img src="https://img.shields.io/badge/Database-Supabase_PostgreSQL-emerald?style=for-the-badge&logo=supabase" alt="Supabase">
    <img src="https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel">
    <img src="https://img.shields.io/badge/Theme-Day%2FNight_Sky_Animated-cyan?style=for-the-badge" alt="Theme">
    <img src="https://img.shields.io/badge/Sidebar-React_Bits_App_Sidebar_4-purple?style=for-the-badge" alt="Sidebar">
  </div>
</div>

---

## 🌟 Overview

**NexusQA** is a dual-role Quality Assurance and Developer workspace built with modern Vanilla JavaScript, CSS custom properties, and PostgreSQL Realtime. It provides tailored experiences for QA Engineers and Software Developers:

1. 🧪 **QA Tester Portal ([`tester.html`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/tester.html))**: Dedicated workspace for test authoring, test execution runs, automated coverage analytics, AI scenario studio, defect filing, and suite organization.
2. 💻 **Developer Command Center ([`dev.html`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/dev.html))**: Dedicated hub for software developers to triage reported bugs, inspect failure steps, approve new tester access requests, review PR branch fixes, and mark bugs ready for re-verification.
3. 🔐 **Unified Gateway & Role Gate ([`index.html`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/index.html))**: Single entrance supporting OTP authentication with role-based routing and developer approval workflows.

---

## 🚀 Key Features

### 🗂️ 1. React Bits "App Sidebar 4" Dual Sidebar Pattern
- **Primary Slim Icon Rail (58px)**: Fixed on the far left with quick module triggers and burger toggle button aligned directly beneath the fixed top-left logo.
- **Contextual Secondary Panel (200px)**: Displays section headers, full labels, active badge counters (*e.g., 12 Test Cases, 4 Active Defects, 2 Approvals*), and a collapse chevron.
- **Smooth Transition**: Fully collapsible/expandable with cubic-bezier easing.

### 🌗 2. Interactive Day/Night Sky Animated Theme Switcher
- **Visual Switch Component**: Custom animated toggle featuring drifting clouds, starry constellation SVG, and sun/moon disc morphing with crater spots.
- **Low-Glare Light Theme**: Eye-friendly soft slate palette (`#edf1f5` canvas, `#ffffff` elevated cards, `#d8e0e8` borders) preventing eye fatigue.
- **Deep Navy Dark Theme**: High-contrast dark theme with glowing indicators and dark glass surfaces.

### 🧪 3. QA Tester Capabilities (`tester.html`)
- **Quality & Health Analytics**: Real-time KPI metrics (Total Test Cases, Pass Rate %, Automation Ratio %, Active Defects) and interactive SVG distribution donut charts.
- **Test Repository**: Full test management with priority badges (`P0` to `P3`), multi-attribute filtering, and quick search.
- **Live Test Runner**: Real-time step execution with live timer, pass/fail status logging, and step-by-step notes.
- **AI Test Studio & Voice Generation**: Prompt-driven test case generator with preset chips and AI export.
- **Defect Tracker & Re-Test Banner**: Real-time alert notifications when developers fix bugs.

### 💻 4. Developer Command Center (`dev.html`)
- **Defect Command Dashboard**: Real-time defect queue and metrics.
- **Tester Approvals & Access Control**: Authorize or reject pending QA tester access requests with real-time feedback.
- **Bug Triage Kanban**: Interactive Kanban workflow (`Open / New`, `In Progress / Fixing`, `Fixed - Ready for QA`, `Closed / Verified`).
- **Failed Test Diagnostics**: Exact test failure step reproduction details with PR linkage and Git branch tags.

---

## ⚡ 1-Minute Supabase Database Setup

To connect your Supabase database:

1. **Create a Free Supabase Project**: Go to [https://supabase.com](https://supabase.com) and create a project.
2. **Run the Database Schema**:
   - In your Supabase Dashboard, click on the **SQL Editor** tab (left sidebar).
   - Click **New query**, paste the entire contents of [`supabase_schema.sql`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/supabase_schema.sql), and click **Run**.
   - *This creates all tables (`nexus_test_cases`, `nexus_suites`, `nexus_defects`, `nexus_test_runs`, `nexus_users`) and enables PostgreSQL Realtime replication.*
3. **Connect NexusQA**:
   - In Supabase, go to **Project Settings** → **API** to copy:
     - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
     - **anon public Key** (e.g., `eyJhbGciOi...`)
   - Open NexusQA, navigate to **Settings**, paste your URL & Key, and click **Connect & Sync**.

---

## 🔑 Demo Login Credentials

For testing and demonstration, use the following pre-configured OTP credentials:

| Persona / Role | Email Address | 6-Digit OTP | Direct Route |
| :--- | :--- | :--- | :--- |
| **Developer Lead** | `chhotumonster225@gmail.com` | `123456` | [`dev.html`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/dev.html) (`/dev`) |
| **QA Tester** | `a@a` | `654321` | [`tester.html`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/tester.html) (`/qa`) |

---

## 📁 Project Structure

```
QA/
├── Glossy Neon Coding Loop Logo.png   # High-resolution 3D Neon App Logo & Favicon
├── index.html                         # Unified Gateway & Login / OTP Verification
├── tester.html                        # Dedicated QA Tester Workspace
├── dev.html                           # Dedicated Developer Command Center
├── css/
│   └── styles.css                     # Complete Design System & Theme Stylesheet
├── js/
│   ├── app.js                         # Core Application Logic, Routing & Navigation
│   └── supabase.js                    # Supabase Client & Realtime Sync Engine
├── supabase_schema.sql                # Complete PostgreSQL Database Schema
├── vercel.json                        # Vercel Deployment & Route Rewrites
└── README.md                          # Project Documentation
```

---

## 🚀 Deploying to Vercel

This repository includes [`vercel.json`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/vercel.json) with configured route rewrites for clean URLs (`/qa`, `/dev`, `/tester`, `/developer`).

### Deploy via CLI:
```bash
npx vercel
```
Or connect this GitHub repository directly in your [Vercel Dashboard](https://vercel.com) for automatic CI/CD deployments on every push to `main`.

---

## 📄 License
MIT License. Created for the NexusQA Engineering Ecosystem.
