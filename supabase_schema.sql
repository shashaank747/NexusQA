-- ============================================================================
-- NexusQA Cloud Backend Database Schema (Safe Namespaced Tables)
-- Note: All tables are strictly prefixed with "nexus_" and use "IF NOT EXISTS"
-- to ensure NO interference with any existing tables in your Supabase project.
-- ============================================================================

-- 1. Users & Team Accounts
CREATE TABLE IF NOT EXISTS public.nexus_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT,
  email TEXT NOT NULL,
  username TEXT,
  role TEXT DEFAULT 'qa',
  role_title TEXT DEFAULT 'QA Tester',
  avatar TEXT DEFAULT 'QA',
  avatar_url TEXT,
  color TEXT DEFAULT '#6366f1',
  phone TEXT,
  department TEXT,
  bio TEXT,
  status TEXT DEFAULT 'active',
  email_verified BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  last_logout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Test Suites & Modules
CREATE TABLE IF NOT EXISTS public.nexus_suites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'fa-solid fa-folder',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Test Cases Repository
CREATE TABLE IF NOT EXISTS public.nexus_test_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  suite_id TEXT REFERENCES public.nexus_suites(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'P1 - High',
  type TEXT DEFAULT 'Functional',
  status TEXT DEFAULT 'Untested',
  qa_status TEXT DEFAULT 'Untested',
  dev_status TEXT DEFAULT 'Pending Dev',
  resolution_status TEXT DEFAULT 'Open',
  preconditions TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  steps_to_reproduce TEXT,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  author TEXT,
  created_by TEXT,
  assigned_to TEXT,
  last_run TEXT DEFAULT 'Never',
  last_viewed_by_dev_id TEXT,
  last_viewed_by_dev_at TIMESTAMPTZ,
  fixed_by_dev_id TEXT,
  fixed_at TIMESTAMPTZ,
  verified_by_tester_id TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Defects & Bugs Tracking
CREATE TABLE IF NOT EXISTS public.nexus_defects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'Medium',
  priority TEXT DEFAULT 'P1 - High',
  status TEXT DEFAULT 'Open',
  linked_test_id TEXT,
  suite_id TEXT,
  assignee TEXT,
  assigned_to TEXT,
  reporter TEXT,
  created_by TEXT,
  notes TEXT,
  repro_steps TEXT,
  steps_to_reproduce TEXT,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  dev_branch TEXT,
  dev_pr TEXT,
  dev_fix_notes TEXT,
  last_viewed_by_dev_id TEXT,
  last_viewed_by_dev_at TIMESTAMPTZ,
  fixed_by_dev_id TEXT,
  fixed_at TIMESTAMPTZ,
  verified_by_tester_id TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Conference Channel Messages & Google Meet Invites
CREATE TABLE IF NOT EXISTS public.nexus_conference_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  project_slug TEXT,
  sender_id TEXT,
  sender_name TEXT,
  sender_role TEXT DEFAULT 'qa',
  role_title TEXT,
  sender_avatar TEXT DEFAULT 'QA',
  message_type TEXT DEFAULT 'text',
  meet_url TEXT,
  text TEXT NOT NULL,
  time_label TEXT,
  date_label TEXT DEFAULT 'Today',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. User Activity & Audit Logs
CREATE TABLE IF NOT EXISTS public.nexus_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  username TEXT,
  user_role TEXT,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  old_value TEXT,
  new_value TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Media Attachments Registry (Screenshots & Videos)
CREATE TABLE IF NOT EXISTS public.nexus_media_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id TEXT,
  defect_id TEXT,
  uploaded_by TEXT,
  uploader_name TEXT,
  file_name TEXT,
  file_type TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Storage Bucket `nexus-evidence`
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('nexus-evidence', 'nexus-evidence', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable Row Level Security (Public Read/Write for Platform Operations)
ALTER TABLE public.nexus_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_conference_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_media_attachments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write access for frontend client
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_users') THEN
    CREATE POLICY "Public Access nexus_users" ON public.nexus_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_suites') THEN
    CREATE POLICY "Public Access nexus_suites" ON public.nexus_suites FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_test_cases') THEN
    CREATE POLICY "Public Access nexus_test_cases" ON public.nexus_test_cases FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_defects') THEN
    CREATE POLICY "Public Access nexus_defects" ON public.nexus_defects FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_conference_messages') THEN
    CREATE POLICY "Public Access nexus_conference_messages" ON public.nexus_conference_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_activity_logs') THEN
    CREATE POLICY "Public Access nexus_activity_logs" ON public.nexus_activity_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_media_attachments') THEN
    CREATE POLICY "Public Access nexus_media_attachments" ON public.nexus_media_attachments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Nexus Evidence Public Read') THEN
    CREATE POLICY "Nexus Evidence Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'nexus-evidence');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Nexus Evidence Public Upload') THEN
    CREATE POLICY "Nexus Evidence Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'nexus-evidence');
  END IF;
END $$;

-- Enable Realtime publication for nexus tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.nexus_users, public.nexus_suites, public.nexus_test_cases, public.nexus_defects, public.nexus_conference_messages, public.nexus_activity_logs, public.nexus_media_attachments;
