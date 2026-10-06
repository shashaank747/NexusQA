-- ============================================================================
-- NexusQA Supabase PostgreSQL Database Schema
-- Run this script in the Supabase SQL Editor (https://app.supabase.com)
-- ============================================================================

-- 1. Test Suites Table
CREATE TABLE IF NOT EXISTS nexus_suites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'fa-solid fa-folder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Test Cases Table
CREATE TABLE IF NOT EXISTS nexus_test_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  suite_id TEXT REFERENCES nexus_suites(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'P1 - High',
  type TEXT DEFAULT 'Manual',
  status TEXT DEFAULT 'Untested',
  author TEXT DEFAULT 'Alex Morgan',
  last_run TEXT DEFAULT 'Never',
  preconditions TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Defects / Bugs Table
CREATE TABLE IF NOT EXISTS nexus_defects (
  id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  linked_test_case_id TEXT,
  severity TEXT DEFAULT 'Major',
  priority TEXT DEFAULT 'P1 - High',
  assignee TEXT DEFAULT 'Marcus Vance',
  reported_by TEXT DEFAULT 'Alex Morgan',
  status TEXT DEFAULT 'Open',
  description TEXT,
  dev_notes TEXT,
  pr_link TEXT,
  git_branch TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Test Runs Table
CREATE TABLE IF NOT EXISTS nexus_test_runs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  environment TEXT DEFAULT 'Staging',
  author TEXT DEFAULT 'Lead QA Engineer',
  date TEXT,
  duration TEXT DEFAULT 'Live',
  status TEXT DEFAULT 'In Progress',
  test_case_ids JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Users Table with Email Verification & Developer Approval Workflow
CREATE TABLE IF NOT EXISTS nexus_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL CHECK (role IN ('qa', 'dev')),
  role_title TEXT,
  avatar TEXT,
  color TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'rejected')),
  email_verified BOOLEAN DEFAULT FALSE,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Enable Realtime for all tables so QA and Dev portals update instantly
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE nexus_suites;
ALTER PUBLICATION supabase_realtime ADD TABLE nexus_test_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE nexus_defects;
ALTER PUBLICATION supabase_realtime ADD TABLE nexus_test_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE nexus_users;

-- ============================================================================
-- Enable Row Level Security (RLS) with Public Anonymous Access Policies
-- ============================================================================
ALTER TABLE nexus_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON nexus_suites FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON nexus_suites FOR ALL USING (true);

CREATE POLICY "Allow anonymous read access" ON nexus_test_cases FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON nexus_test_cases FOR ALL USING (true);

CREATE POLICY "Allow anonymous read access" ON nexus_defects FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON nexus_defects FOR ALL USING (true);

CREATE POLICY "Allow anonymous read access" ON nexus_test_runs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON nexus_test_runs FOR ALL USING (true);

CREATE POLICY "Allow anonymous read access" ON nexus_users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON nexus_users FOR ALL USING (true);
