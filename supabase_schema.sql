-- EduWatch - Complete Supabase Database Schema
-- Paste this into the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- 0. Setup Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (Syncs with Auth or managed manually)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'GUIDANCE', 'STUDENT', 'PARENT')),
  is_approved BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
  id TEXT PRIMARY KEY DEFAULT (substr(md5(random()::text), 0, 10)), -- Matches app's short string IDs
  reporter_id UUID REFERENCES public.profiles(id),
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Discipline', 'Counseling Request', 'Welfare Check')),
  incident_type TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'ARCHIVED')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  ai_analysis JSONB DEFAULT NULL, -- Stores structural output from Gemini
  internal_notes JSONB DEFAULT '[]'::jsonb, -- Array of objects: {id, authorId, authorName, content, createdAt}
  evidence_photos TEXT[] DEFAULT '{}', -- Array of base64 strings or storage bucket URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Mood Entries Table (Wellness Tracking)
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_value INTEGER NOT NULL CHECK (mood_value >= 1 AND mood_value <= 5),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT, -- ID of the incident or user affected
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create System Alerts Table (Dashboard Notifications)
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INFO', 'EMERGENCY')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON public.incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_student ON public.incidents(student_name);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_mood_user_time ON public.mood_entries(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_time ON public.activity_logs(timestamp DESC);

-- 7. Basic Row Level Security (RLS)
-- To enable full security, toggle "Enable RLS" in the Supabase UI for each table.
-- These policies allow all authenticated users to read data (common for internal school tools).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access') THEN
        CREATE POLICY "Public Access" ON public.profiles FOR ALL USING (true);
        CREATE POLICY "Public Access" ON public.incidents FOR ALL USING (true);
        CREATE POLICY "Public Access" ON public.mood_entries FOR ALL USING (true);
        CREATE POLICY "Public Access" ON public.activity_logs FOR ALL USING (true);
        CREATE POLICY "Public Access" ON public.system_alerts FOR ALL USING (true);
    END IF;
END $$;

-- 8. Seed Initial System Accounts
INSERT INTO public.profiles (id, email, full_name, role, is_approved)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@school.edu', 'Super Admin', 'ADMIN', true),
  ('00000000-0000-0000-0000-000000000002', 'guidance@school.edu', 'Ms. Sarah Connor', 'GUIDANCE', true),
  ('00000000-0000-0000-0000-000000000003', 'teacher@school.edu', 'Mr. John Wick', 'TEACHER', true)
ON CONFLICT (email) DO NOTHING;