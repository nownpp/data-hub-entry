
-- Add collector_name to track who entered each submission
ALTER TABLE public.submissions
ADD COLUMN collector_name TEXT;

-- Create collectors table to manage data entry people
CREATE TABLE public.collectors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on collectors
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;

-- Anyone can read collectors (to validate links)
CREATE POLICY "Anyone can read active collectors"
ON public.collectors
FOR SELECT
USING (is_active = true);

-- Only authenticated users can manage collectors
CREATE POLICY "Authenticated users can insert collectors"
ON public.collectors
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update collectors"
ON public.collectors
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete collectors"
ON public.collectors
FOR DELETE
TO authenticated
USING (true);

-- Authenticated users can also see inactive collectors
CREATE POLICY "Authenticated users can read all collectors"
ON public.collectors
FOR SELECT
TO authenticated
USING (true);
