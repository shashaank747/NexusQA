-- ============================================================================
-- NexusQA Cloud Backend Database Schema (Safe Namespaced Tables)
-- Note: All tables are strictly prefixed with "nexus_" and use "IF NOT EXISTS"
-- to ensure NO interference with any existing tables in your Supabase project.
-- ============================================================================

-- 1. Test Suites & Modules
CREATE TABLE IF NOT EXISTS public.nexus_suites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'fa-solid fa-folder',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Test Cases Repository
CREATE TABLE IF NOT EXISTS public.nexus_test_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  suite_id TEXT REFERENCES public.nexus_suites(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'P1 - High',
  type TEXT DEFAULT 'Functional',
  status TEXT DEFAULT 'Untested',
  preconditions TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  author TEXT,
  last_run TEXT DEFAULT 'Never',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Defects & Bugs Tracking
CREATE TABLE IF NOT EXISTS public.nexus_defects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'Medium',
  priority TEXT DEFAULT 'P1 - High',
  status TEXT DEFAULT 'Open',
  linked_test_id TEXT,
  assignee TEXT,
  reporter TEXT,
  notes TEXT,
  repro_steps TEXT,
  dev_branch TEXT,
  dev_pr TEXT,
  dev_fix_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (Public Read/Write for Platform Demo)
ALTER TABLE public.nexus_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_defects ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write access for frontend client
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_suites') THEN
    CREATE POLICY "Public Access nexus_suites" ON public.nexus_suites FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_test_cases') THEN
    CREATE POLICY "Public Access nexus_test_cases" ON public.nexus_test_cases FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_defects') THEN
    CREATE POLICY "Public Access nexus_defects" ON public.nexus_defects FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Enable Realtime publication for nexus tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.nexus_suites, public.nexus_test_cases, public.nexus_defects;
