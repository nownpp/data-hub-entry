
-- Add password_hash column to collectors table
ALTER TABLE public.collectors ADD COLUMN password_hash text;
