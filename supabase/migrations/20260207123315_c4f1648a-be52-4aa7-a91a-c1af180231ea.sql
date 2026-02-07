
-- Create table for submissions
CREATE TABLE public.submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can submit data"
ON public.submissions
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view submissions
CREATE POLICY "Authenticated users can view submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete submissions"
ON public.submissions
FOR DELETE
TO authenticated
USING (true);
