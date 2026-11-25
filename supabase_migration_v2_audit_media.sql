-- ============================================================================
-- NexusQA Migration v2: Full Audit Trail, User Presence, Lifecycle Timestamps,
-- and Media Attachments (Storage Bucket: nexus-evidence)
-- Safe & idempotent: can be run repeatedly in Supabase SQL Editor.
-- ============================================================================

-- 1. Upgrade nexus_users (Full Profile & Session Timestamps)
ALTER TABLE public.nexus_users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Backfill full_name from name where missing
UPDATE public.nexus_users
SET full_name = name
WHERE full_name IS NULL AND name IS NOT NULL;

-- 2. Upgrade nexus_test_cases (Lifecycle & Ownership Timestamps)
ALTER TABLE public.nexus_test_cases
  ADD COLUMN IF NOT EXISTS suite_id TEXT REFERENCES public.nexus_suites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS qa_status TEXT DEFAULT 'Untested',
  ADD COLUMN IF NOT EXISTS dev_status TEXT DEFAULT 'Pending Dev',
  ADD COLUMN IF NOT EXISTS resolution_status TEXT DEFAULT 'Open',
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS steps_to_reproduce TEXT,
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS last_viewed_by_dev_id TEXT,
  ADD COLUMN IF NOT EXISTS last_viewed_by_dev_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fixed_by_dev_id TEXT,
  ADD COLUMN IF NOT EXISTS fixed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by_tester_id TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 3. Upgrade nexus_defects (Lifecycle & Ownership Timestamps)
ALTER TABLE public.nexus_defects
  ADD COLUMN IF NOT EXISTS suite_id TEXT,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS steps_to_reproduce TEXT,
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS last_viewed_by_dev_id TEXT,
  ADD COLUMN IF NOT EXISTS last_viewed_by_dev_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fixed_by_dev_id TEXT,
  ADD COLUMN IF NOT EXISTS fixed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by_tester_id TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 4. Create nexus_activity_logs (Every Click, View, Login, Logout & Status Change)
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

CREATE INDEX IF NOT EXISTS idx_nexus_activity_logs_created_at
  ON public.nexus_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_activity_logs_target
  ON public.nexus_activity_logs (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_nexus_activity_logs_user
  ON public.nexus_activity_logs (user_id, action_type);

-- 5. Create nexus_media_attachments (Screenshots & Screen Recordings)
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

CREATE INDEX IF NOT EXISTS idx_nexus_media_test_case
  ON public.nexus_media_attachments (test_case_id);
CREATE INDEX IF NOT EXISTS idx_nexus_media_defect
  ON public.nexus_media_attachments (defect_id);

-- 6. Create nexus_conference_messages (Project Chat & Google Meet Invites)
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

-- 7. Create Supabase Storage Bucket `nexus-evidence` (Public Read + Upload Policies)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nexus-evidence',
  'nexus-evidence',
  true,
  52428800,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Nexus Evidence Public Read') THEN
    CREATE POLICY "Nexus Evidence Public Read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'nexus-evidence');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Nexus Evidence Public Upload') THEN
    CREATE POLICY "Nexus Evidence Public Upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'nexus-evidence');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Nexus Evidence Public Update') THEN
    CREATE POLICY "Nexus Evidence Public Update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'nexus-evidence');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Nexus Evidence Public Delete') THEN
    CREATE POLICY "Nexus Evidence Public Delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'nexus-evidence');
  END IF;
END $$;

-- 8. Row Level Security & Policies for Audit Logs, Media Attachments & Conference Messages
ALTER TABLE public.nexus_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_media_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_conference_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_activity_logs') THEN
    CREATE POLICY "Public Access nexus_activity_logs"
      ON public.nexus_activity_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_media_attachments') THEN
    CREATE POLICY "Public Access nexus_media_attachments"
      ON public.nexus_media_attachments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access nexus_conference_messages') THEN
    CREATE POLICY "Public Access nexus_conference_messages"
      ON public.nexus_conference_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 9. Enable Supabase Realtime for new audit, media & conference tables (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nexus_activity_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nexus_media_attachments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nexus_conference_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
