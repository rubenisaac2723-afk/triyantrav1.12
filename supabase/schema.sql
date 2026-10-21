-- Supabase Database Schema for TriYantra Contact / Lead Submissions
-- Execute this script in your Supabase Dashboard: SQL Editor -> New Query -> Run

-- 1. Create the leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID UNIQUE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('quote', 'demo')),
  full_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT,
  employees TEXT,
  devices TEXT,
  requirement_type TEXT,
  device_type TEXT,
  locations TEXT,
  start_date DATE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create indices for fast querying and indexing
CREATE INDEX IF NOT EXISTS idx_leads_request_id ON public.leads (request_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_work_email ON public.leads (work_email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 4. Idempotent Policy Management:
-- Allows insert, update (idempotent upsert), and service administration
DROP POLICY IF EXISTS "Enable insert for authenticated and service roles only" ON public.leads;
DROP POLICY IF EXISTS "Allow lead submissions" ON public.leads;

CREATE POLICY "Allow lead submissions"
  ON public.leads
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);
