
-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  service_price NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active subjects" ON public.subjects FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can read all subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert subjects" ON public.subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update subjects" ON public.subjects FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete subjects" ON public.subjects FOR DELETE USING (true);

-- Add subject_id to submissions
ALTER TABLE public.submissions ADD COLUMN subject_id UUID REFERENCES public.subjects(id);
ALTER TABLE public.submissions ADD COLUMN subject_name TEXT;
