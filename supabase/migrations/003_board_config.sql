-- Add config column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN config JSONB DEFAULT '{"rows": 6, "cols": 22, "theme": "classic"}'::jsonb;

-- Update existing sessions to have default config
UPDATE public.sessions 
SET config = '{"rows": 6, "cols": 22, "theme": "classic"}'::jsonb 
WHERE config IS NULL;
