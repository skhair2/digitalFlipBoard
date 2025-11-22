-- Add grid dimension columns to saved_designs table
ALTER TABLE public.saved_designs 
ADD COLUMN grid_rows INTEGER DEFAULT 6,
ADD COLUMN grid_cols INTEGER DEFAULT 22;

-- Update existing designs to have default dimensions
UPDATE public.saved_designs 
SET grid_rows = 6, grid_cols = 22 
WHERE grid_rows IS NULL OR grid_cols IS NULL;
