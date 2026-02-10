
-- Create batches table for grouping submissions into delivery batches
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_name TEXT NOT NULL,
  is_delivered BOOLEAN NOT NULL DEFAULT false,
  submissions_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Add batch_id to submissions
ALTER TABLE public.submissions ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;

-- Enable RLS on batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for batches
CREATE POLICY "Authenticated users can view all batches"
ON public.batches FOR SELECT USING (true);

CREATE POLICY "Anyone can insert batches"
ON public.batches FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update batches"
ON public.batches FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete batches"
ON public.batches FOR DELETE USING (true);
