<div align="center">
  <img src="Glossy Neon Coding Loop Logo.png" alt="NexusQA Logo" width="110" height="110" style="border-radius: 24px; filter: drop-shadow(0 10px 25px rgba(99, 102, 241, 0.45)); margin-bottom: 12px;">
  <h1>NexusQA & CampusOS Conversational AI Assistant</h1>
  <p><strong>Enterprise Quality Engineering Ecosystem, Developer Command Center & Conversational AI QA Assistant</strong></p>

  <div>
    <img src="https://img.shields.io/badge/AI_Engine-Conversational_QA_NLP-indigo?style=for-the-badge&logo=openai" alt="AI Engine">
    <img src="https://img.shields.io/badge/Tracker_Schema-22--Column_Excel-emerald?style=for-the-badge&logo=microsoftexcel" alt="Excel Schema">
    <img src="https://img.shields.io/badge/Database-Supabase_PostgreSQL-emerald?style=for-the-badge&logo=supabase" alt="Supabase">
    <img src="https://img.shields.io/badge/Architecture-Dual_Portal_QA_%2B_Dev-purple?style=for-the-badge" alt="Architecture">
    <img src="https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel">
  </div>
</div>

> [!CAUTION]
> ### 🛑 PROPRIETARY & CONFIDENTIAL — STRICTLY DO NOT CLONE OR REPRODUCE
> **This repository, conversational AI QA algorithms, 22-column tracking engine, dataset schemas, and UI design systems are private and proprietary intellectual property. Unauthorized cloning, downloading, copying, redistribution, public forking, scraping, indexing, or commercial reproduction of any part of this codebase is strictly prohibited.**

---

## 📖 Table of Contents

1. [🌟 Executive Overview](#-executive-overview)
2. [🤖 Conversational AI QA Assistant (CampusOS Engine)](#-conversational-ai-qa-assistant-campusos-engine)
   - [Basic User Flow](#basic-user-flow)
   - [Multi-Message Context & Session Management](#multi-message-context--session-management)
   - [Factual Extraction & Numerical Mismatch Reasoning](#factual-extraction--numerical-mismatch-reasoning)
   - [Expected vs Actual Separation](#expected-vs-actual-separation)
   - [Bug vs Enhancement vs Observation](#bug-vs-enhancement-vs-observation)
   - [Cross-Role Comparison (Trainer ↔ Student)](#cross-role-comparison-trainer--student)
   - [Existing Bug Matching & Duplicate Detection](#existing-bug-matching--duplicate-detection)
   - [Voice Dictation & Screenshot Evidence](#voice-dictation--screenshot-evidence)
3. [📊 EXACT 22-Column Excel / TSV / CSV Export Schema](#-exact-22-column-excel--tsv--csv-export-schema)
4. [🔒 Controlled Dropdown Architecture](#-controlled-dropdown-architecture)
5. [📚 CampusOS Task Reference Table (20-Field Benchmark Schema)](#-campusos-task-reference-table-20-field-benchmark-schema)
6. [🖥️ Dual-Role Workspaces](#-dual-role-workspaces)
   - [QA Tester Portal (`tester.html`)](#qa-tester-portal-testerhtml)
   - [Developer Command Center (`dev.html`)](#developer-command-center-devhtml)
   - [Unified Gateway & Role Gate (`index.html`)](#unified-gateway--role-gate-indexhtml)
7. [⚡ 1-Minute Supabase Database Setup](#-1-minute-supabase-database-setup)
8. [🔑 Demo Login Credentials](#-demo-login-credentials)
9. [📁 Comprehensive Project Structure](#-comprehensive-project-structure)
10. [🚀 Deployment Guide (Vercel)](#-deployment-guide-vercel)

---

## 🌟 Executive Overview

**NexusQA** is an enterprise-grade Quality Assurance & Software Development ecosystem designed for high-velocity software teams and **CampusOS** application testing. 

Instead of forcing QA testers to manually type out dozens of boilerplate fields in spreadsheets, NexusQA features a **Conversational AI QA Assistant**: testers dictate or type observations naturally across one or multiple messages, attach screenshots, and the AI converts those observations into structured QA test cases, defect cards, and an **EXACT 22-column Excel tracker schema**.

```text
┌─────────────────────────────────────────────────────────────┐
│                    QA TESTER NARRATION                      │
│   🎤 Voice Dictation  |  💬 Natural Text  |  📎 Screenshot  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 CONTEXT & SESSION MANAGER                   │
│   • Active Test Benchmark (e.g. Test 5)                     │
│   • Role Context (Trainer vs Student Side)                  │
│   • Multi-Message History Aggregator                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               CONVERSATIONAL QA AI ENGINE                   │
│   • Factual Information & Numerical Mismatch Extraction     │
│   • Expected Result vs Actual Result Separation             │
│   • Bug vs Enhancement vs Observation Classification        │
│   • Duplicate Defect Matching (e.g. BUG-037)                │
│   • Strict Controlled Dropdown Mapping                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             INTERACTIVE HUMAN REVIEW PANEL                  │
│   • Side-by-side Expected vs Actual Comparison              │
│   • Live Inline 22-Column Editor with Controlled Dropdowns  │
│   • Duplicate Bug Conflict Resolution                       │
│   [Confirm & Save]   [Edit Fields]   [Copy 22-Col TSV]      │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    STRUCTURED DATABASE      │ │      EXCEL / TSV / CSV      │
│  • Test Cases Repository    │ │  • Exact 22 Columns         │
│  • Defects & Bug Tracker    │ │  • 1-Click Clipboard TSV    │
│  • Supabase Cloud Realtime  │ │  • Formatted RFC CSV File   │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 🤖 Conversational AI QA Assistant (CampusOS Engine)

### Basic User Flow

1. **Tester Speaks or Types**: The QA tester inputs observations naturally (e.g., *"I'm testing Test 5. It's a Fill in the Blanks task, medium difficulty, Python, 5 questions. From the trainer side there are 5 questions, but when I open it as a student I only see one."*).
2. **Context Manager Aggregates**: Multi-message notes are linked into one coherent testing session.
3. **Fact Extraction & Mismatch Engine**: Detects discrepancies between expected configurations and actual behavior.
4. **Existing Bug Matching**: Checks existing defect repository for known bugs.
5. **Human Review Panel**: Presents structured records with side-by-side Expected vs Actual comparisons.
6. **Confirmed DB Sync & 22-Column Export**: Tester approves or edits fields; data syncs to the database and exports to Excel/TSV.

---

### Multi-Message Context & Session Management

Testers frequently describe findings across multiple short messages:

```text
Message 1: "I'm testing Test 5."
Message 2: "It's Fill in the Blanks, Medium, Python."
Message 3: "Trainer created 5 questions."
Message 4: "Student only sees one."
Message 5: "There is also a coding challenge which shouldn't be there."
```

- The Assistant maintains a **persistent session state**:
  ```json
  {
    "current_session": {
      "test_reference": "Test 5",
      "module": "Tasks",
      "side": "Student",
      "task_type": "Fill in the Blanks",
      "difficulty": "Medium",
      "language": "Python",
      "trainer_question_count": 5,
      "student_question_count": 1
    }
  }
  ```
- **Does NOT create 5 separate test cases**. It aggregates context and generates structured records only when actual findings are observed.

---

### Factual Extraction & Numerical Mismatch Reasoning

- **No Hallucination Rule**: If a field is not supplied by the tester, the AI sets `"Not Provided"`, `"Not Tested"`, or `"Not Applicable"`. If crucial information is missing to classify a finding, the AI asks a concise clarifying question (e.g., *"Which task/test number are you testing?"*).
- **Numerical Mismatch Extraction**:
  - Input: *"Trainer created 15 coding questions but students only get one."*
  - Extracted:
    ```json
    {
      "trainer_question_count": 15,
      "student_question_count": 1,
      "expected_count": 15,
      "actual_count": 1,
      "mismatch": true
    }
    ```

---

### Expected vs Actual Separation

The engine automatically partitions observations into distinct **Expected** and **Actual** fields:

- **Expected Result**: What should have happened according to system requirements.
  - *Example: "Student should see all 5 published questions."*
- **Actual Result**: What actually happened during execution.
  - *Example: "Student sees only 1 question."*

---

### Bug vs Enhancement vs Observation

Findings are classified into strict categories:
- 🐛 **Bug (Defect)**: Functional failure, numerical mismatch, or unexpected injection. (*Test Result = `Fail`*, *Bug Status = `Open`*).
- 💡 **Enhancement (Improvement)**: Layout, ergonomic, or UX suggestions (e.g., *"The question should be on the left and compiler on the right"*). (*Test Result = `Pass`*, *Test Case Type = `Enhancement`*).
- 📝 **Combined Observations**: When a tester mentions both a bug and a UI layout suggestion in the same narration, the Assistant generates **two separate structured records**, rather than conflating them.

---

### Cross-Role Comparison (Trainer ↔ Student)

CampusOS workflows often involve configuring content under one persona and verifying it under another:

| Persona | Observation / Action | Extracted Context |
| :--- | :--- | :--- |
| **Trainer Side** | Published 5 Fill in the Blanks questions | Expected Question Count = `5` |
| **Student Side** | Opens task attempt view | Actual Question Count = `1` |
| **AI Diagnosis** | **Cross-Role Mismatch Detected** | Severity = `Major`, Status = `Open` |

---

### Existing Bug Matching & Duplicate Detection

Before generating a new Bug ID, the engine scans the existing defect database:

1. **High-Confidence Exact Match** ($\ge 80\%$ match):
   - Example: Existing defect `BUG-037` (*"Python selected but Java boilerplate displayed"*).
   - New observation: *"Test 5 also has Python selected but Java boilerplate."*
   - AI assigns existing `Bug ID = BUG-037` to prevent duplicate bug ticket generation.
2. **Medium-Confidence Candidate Match** ($45\% - 79\%$ match):
   - Example: *"Python selected but C++ boilerplate."*
   - AI presents an interactive alert with options: `[Use Existing Bug BUG-037]` vs `[Create New Bug ID]`.

---

### Voice Dictation & Screenshot Evidence

- 🎤 **Voice Dictation**: Uses the Web Speech API with real-time audio pulse animations, transcribing testing speech directly into the prompt stream.
- 📎 **Screenshot Evidence**: Paste screenshots directly with `Ctrl+V` or upload image files. Images are previewed in the evidence bar and permanently linked to the resulting QA record under `screenshot_evidence`.

---

## 📊 EXACT 22-Column Excel / TSV / CSV Export Schema

When exporting test records for stakeholders, Excel trackers, or Google Sheets, the Assistant formats data using **exactly these 22 columns in this exact order**:

| # | Column Name | Format / Example | Description |
|---:|:---|:---|:---|
| **1** | **Test Module** | `Tasks`, `Assessments`, `Courses` | Main CampusOS module being tested |
| **2** | **Test Case ID** | `TC-TASK-021`, `TC-AUTH-105` | Unique test case identifier |
| **3** | **Test Case Type** | `Bug`, `Enhancement` | Type of QA record |
| **4** | **Bug ID** | `BUG-037` *(or blank for Enhancement)* | Unique defect identifier |
| **5** | **Date** | `2026-10-08` (`YYYY-MM-DD`) | Date test was performed |
| **6** | **Module** | `Student Task Attempt`, `Tasks` | Specific functional section |
| **7** | **Feature** | `Question Count / Visibility`, `Language Selector` | Target feature under test |
| **8** | **Bug Type** | `Functional`, `Configuration`, `UI Improvement` | Defect categorization |
| **9** | **Severity** | `Critical`, `Major`, `Medium`, `Minor`, `Trivial` | Impact level |
| **10** | **Title** | `Test 5: Only one of 5 questions shown to student` | Developer-friendly summary |
| **11** | **Preconditions** | `Test 5 is published as a Fill in the Blanks task.` | Prerequisites required |
| **12** | **Steps to Reproduce** | `1. Login as Trainer... \| 2. Login as Student...` | Step-by-step reproduction |
| **13** | **Expected Result** | `Student should see all 5 published questions.` | Expected behavior |
| **14** | **Actual Result** | `Student sees only 1 question.` | Observed behavior |
| **15** | **Test Result** | `Pass`, `Fail`, `Not Run`, `Blocked`, `Not Applicable` | Test execution outcome |
| **16** | **AI Response** | `Not Applicable` | AI model response if applicable |
| **17** | **Reference Answer** | `Not Applicable` | Reference answer if applicable |
| **18** | **Reproducibility** | `Yes`, `No`, `Not Tested`, `Intermittent` | Defaults to `Not Tested` |
| **19** | **Screenshot / Evidence** | `Screenshot-143022.png` | Evidence identifier / attachment |
| **20** | **Notes** | `Test 5; numerical mismatch detected.` | Additional testing context |
| **21** | **Bug Status** | `Open`, `Passed`, `Fixed`, `Check`, `Retest` | Defect lifecycle status |
| **22** | **Side** | `Trainer`, `Student` | Role executing the test |

---

## 🔒 Controlled Dropdown Architecture

Dropdown values are managed centrally in [`js/data.js`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/js/data.js) and dynamically enforced across the AI engine and UI editors:

```javascript
const CONTROLLED_DROPDOWNS = {
  test_case_type: ["Bug", "Enhancement"],
  test_result: ["Pass", "Fail", "Not Run", "Blocked", "Not Applicable"],
  reproducibility: ["Yes", "No", "Not Tested", "Intermittent"],
  bug_status: ["Passed", "Completed", "Closed", "Open", "Not Run", "Passes", "Testing", "Check", "Fixed", "Retest"],
  side: ["Trainer", "Student"],
  severity: ["Critical", "Major", "Medium", "Minor", "Trivial"],
  bug_type: ["Functional", "Content", "Configuration", "Scoring", "Content Quality", "UI Improvement"],
  test_module: ["Tasks", "Assessments", "Courses", "Authentication", "Dashboard", "Reports", "Settings", "Student Portal"]
};
```

---

## 📚 CampusOS Task Reference Table (20-Field Benchmark Schema)

Maintains task benchmarks used by the AI to compare Trainer configurations against Student attempts:

| Field | Description | Example Value |
|:---|:---|:---|
| `task_name` | Task identifier | `Test 5` |
| `description` | Summary of task scope | `Fill in the Blanks task for Python fundamentals` |
| `task_type` | Nature of task | `Fill in the Blanks` |
| `difficulty` | Target difficulty | `Medium` |
| `language` | Programming Language | `Python` |
| `xp` | XP Reward | `20` |
| `time_limit` | Time allocated | `30 mins` |
| `question_count` | Trainer question count | `5` |
| `question_source` | Generation origin | `Trainer Created` |
| `topic` | Subject matter | `Python Lists, Dicts & Slicing` |
| `skills_tags` | Skills array | `["python", "collections", "slicing"]` |
| `generation_time` | Benchmark generation latency | `0.5s` |
| `task_content` | Exercise overview | `5 Fill in the blank exercises on slicing` |
| `ai_quality_check` | Pre-publication QA check | `Passed` |
| `hints_support` | Hint availability | `Enabled (2 hints)` |
| `batch_selected` | Cohort assignment | `Batch A-2026` |
| `published` | Publication state | `true` |
| `student_attempt` | Student assignment status | `Assigned` |
| `navigation_flow` | UI breadcrumb path | `Dashboard -> Tasks -> My Tasks -> Today's Task -> Test 5` |
| `status_notes` | Reference status | `Active CampusOS Task Reference` |

---

## 🖥️ Dual-Role Workspaces

### QA Tester Portal (`tester.html`)
- **Conversational AI Studio**: Open with the `Auto Input` pill from the topbar, dashboard, or repository.
- **Live Test Runner**: Real-time step execution with stopwatch timer and pass/fail logging.
- **Test Repository**: Multi-suite categorization, tagging, and priority filtering.
- **Metrics Dashboard**: SVG donut charts and live health metrics.

### Developer Command Center (`dev.html`)
- **Bug Triage Kanban**: Drag-and-drop workflow (`Open`, `In Progress`, `Fixed - Ready for QA`, `Closed`).
- **PR & Branch Links**: Attach GitHub PR URLs and branch names directly to defect fixes.
- **Tester Access Approvals**: Approve or reject pending QA tester accounts.

### Unified Gateway & Role Gate (`index.html`)
- Unified login with role-based routing (`/qa` for Testers, `/dev` for Developers).
- 6-digit email OTP verification.

---

## ⚡ 1-Minute Supabase Database Setup

NexusQA connects to Supabase for cloud sync and multi-user collaboration:

1. **Create a Free Supabase Project**: Go to [https://supabase.com](https://supabase.com).
2. **Execute Database Schema**:
   - Open **SQL Editor** in Supabase.
   - Run the script in [`supabase_schema.sql`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/supabase_schema.sql).
3. **Connect NexusQA**:
   - In Supabase, copy your **Project URL** and **anon public Key** from **Project Settings** → **API**.
   - Open NexusQA, go to **Settings**, paste credentials, and click **Connect & Sync**.

---

## 🔑 Demo Login Credentials

| Role | Email / Identifier | Passcode | Target Portal |
| :--- | :--- | :--- | :--- |
| **QA Tester** | `a@a` | `654321` | [`tester.html`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/tester.html) (`/qa`) |
| **Lead Developer** | `dev@nexusqa.io` | `123456` | [`dev.html`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/dev.html) (`/dev`) |

---

## 📁 Comprehensive Project Structure

```
QA/
├── Glossy Neon Coding Loop Logo.png   # 3D Neon App Logo & Favicon
├── index.html                         # Unified Gateway & Authentication Portal
├── tester.html                        # QA Tester Workspace & AI Auto-Input Studio
├── dev.html                           # Developer Command Center & Bug Triage Hub
├── 404.html                           # Error fallback page
├── css/
│   └── styles.css                     # Design System, Glassmorphism, Theme & AI Studio UI
├── js/
│   ├── auth-motion.js                 # Interactive Physics Canvas Background
│   ├── data.js                        # Controlled Dropdowns, 22-Col Schema & Seed Benchmarks
│   ├── qa-assistant.js                # CampusOS Conversational QA Engine & NLP Parser
│   ├── storage.js                     # LocalStorage State Manager & BroadcastSync
│   ├── supabase.js                    # Supabase Realtime SDK Integration
│   └── app.js                         # Core Controller, UI Renderers & Modal Handlers
├── supabase_schema.sql                # Complete PostgreSQL Database Schema with RLS
├── vercel.json                        # Vercel Deployment & URL Route Rewrites
├── package.json                       # Project metadata and dependencies
└── README.md                          # Comprehensive Technical Documentation
```

---

## 🚀 Deployment Guide (Vercel)

This repository includes [`vercel.json`](file:///c:/Users/Shashaank%20Sajjanar/Desktop/Random%20Projects/QA/vercel.json) with clean route rewrites:
- `/qa` $\rightarrow$ `tester.html`
- `/dev` $\rightarrow$ `dev.html`
- `/login` $\rightarrow$ `index.html`

### Deploy via CLI:
```bash
npx vercel
```
Or import the repository into your [Vercel Dashboard](https://vercel.com) for automatic CI/CD on every push.

---

## 📄 License & Proprietary Rights

> [!CAUTION]
> **STRICTLY PROPRIETARY & CONFIDENTIAL — DO NOT CLONE OR REPRODUCE**
> 
> All rights reserved. **No one is permitted to clone, fork, copy, scrape, reverse-engineer, distribute, or reproduce any portion of this repository**, source code, conversational QA algorithms, 22-column schema engine, or UI architecture in any format without prior written consent.
