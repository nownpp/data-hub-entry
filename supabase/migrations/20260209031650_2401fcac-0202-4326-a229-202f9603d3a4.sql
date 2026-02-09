
-- Create system settings table for service price and commission
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (collectors need to see prices)
CREATE POLICY "Anyone can read settings"
ON public.system_settings FOR SELECT
USING (true);

-- Only authenticated users (admins) can manage settings
CREATE POLICY "Authenticated users can insert settings"
ON public.system_settings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
ON public.system_settings FOR UPDATE
TO authenticated
USING (true);

-- Add is_delivered column to submissions
ALTER TABLE public.submissions ADD COLUMN is_delivered boolean NOT NULL DEFAULT false;

-- Add UPDATE policy on submissions for admin to mark as delivered
CREATE POLICY "Authenticated users can update submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (true);

-- Insert default settings
INSERT INTO public.system_settings (key, value) VALUES
  ('service_price', '100'),
  ('commission_amount', '10');
