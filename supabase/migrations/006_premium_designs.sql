-- Premium Designs Table
-- Stores designs that users create and save (only for paying customers)
CREATE TABLE IF NOT EXISTS public.premium_designs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  layout jsonb NOT NULL,  -- Array of { char, color }
  grid_rows integer DEFAULT 6,
  grid_cols integer DEFAULT 22,
  thumbnail_url text,  -- Preview image URL
  is_template boolean DEFAULT FALSE,  -- Mark as reusable template
  tags text[] DEFAULT '{}'::text[],  -- Search/categorization
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT valid_grid_dimensions CHECK (grid_rows > 0 AND grid_cols > 0)
);

-- Design Versions Table
-- Stores version history of designs for rollback capability
CREATE TABLE IF NOT EXISTS public.design_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id uuid REFERENCES public.premium_designs(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  layout jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  change_description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT unique_design_version UNIQUE(design_id, version_number)
);

-- Design Collections/Categories Table
-- Organize designs into folders/collections
CREATE TABLE IF NOT EXISTS public.design_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT FALSE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT unique_user_collection_name UNIQUE(user_id, name)
);

-- Bridge table for designs in collections
CREATE TABLE IF NOT EXISTS public.design_collection_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid REFERENCES public.design_collections(id) ON DELETE CASCADE NOT NULL,
  design_id uuid REFERENCES public.premium_designs(id) ON DELETE CASCADE NOT NULL,
  position integer DEFAULT 0,  -- Order in collection
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT unique_design_collection UNIQUE(collection_id, design_id)
);

-- Design Likes/Favorites Table
-- Track which designs users have liked (for social features)
CREATE TABLE IF NOT EXISTS public.design_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id uuid REFERENCES public.premium_designs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT unique_design_like UNIQUE(design_id, user_id)
);

-- Update profiles table to track design usage statistics
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_designs integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_designs integer DEFAULT 5,  -- Free: 5, Pro: unlimited
ADD COLUMN IF NOT EXISTS max_collection_size integer DEFAULT 10;  -- Pro feature

-- Enable RLS
ALTER TABLE public.premium_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_collection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for premium_designs
CREATE POLICY "Users can view their own designs"
  ON public.premium_designs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public template designs"
  ON public.premium_designs FOR SELECT
  USING (is_template = TRUE AND is_public = TRUE);

CREATE POLICY "Users can insert their own designs"
  ON public.premium_designs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs"
  ON public.premium_designs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs"
  ON public.premium_designs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for design_versions
CREATE POLICY "Users can view versions of their designs"
  ON public.design_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.premium_designs
      WHERE premium_designs.id = design_versions.design_id
      AND premium_designs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their designs"
  ON public.design_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.premium_designs
      WHERE premium_designs.id = design_versions.design_id
      AND premium_designs.user_id = auth.uid()
    )
  );

-- RLS Policies for design_collections
CREATE POLICY "Users can view their own collections"
  ON public.design_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections"
  ON public.design_collections FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can insert their own collections"
  ON public.design_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.design_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.design_collections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for design_collection_members
CREATE POLICY "Users can view members in their collections"
  ON public.design_collection_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_collections
      WHERE design_collections.id = design_collection_members.collection_id
      AND design_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add designs to their collections"
  ON public.design_collection_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.design_collections
      WHERE design_collections.id = design_collection_members.collection_id
      AND design_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove designs from their collections"
  ON public.design_collection_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.design_collections
      WHERE design_collections.id = design_collection_members.collection_id
      AND design_collections.user_id = auth.uid()
    )
  );

-- RLS Policies for design_likes
CREATE POLICY "Users can view all likes"
  ON public.design_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can like designs"
  ON public.design_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike designs"
  ON public.design_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_premium_designs_user_id ON public.premium_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_designs_created_at ON public.premium_designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_designs_is_template ON public.premium_designs(is_template) WHERE is_template = TRUE;
CREATE INDEX IF NOT EXISTS idx_design_versions_design_id ON public.design_versions(design_id);
CREATE INDEX IF NOT EXISTS idx_design_collections_user_id ON public.design_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_design_likes_design_id ON public.design_likes(design_id);
CREATE INDEX IF NOT EXISTS idx_design_likes_user_id ON public.design_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_design_collection_members_collection_id ON public.design_collection_members(collection_id);

-- Create function to enforce design limits based on subscription
CREATE OR REPLACE FUNCTION public.check_design_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_profile public.profiles;
  design_count integer;
BEGIN
  -- Get user's profile and subscription info
  SELECT * INTO user_profile FROM public.profiles WHERE id = NEW.user_id;
  
  -- Free tier: max 5 designs
  IF user_profile.subscription_tier = 'free' THEN
    SELECT COUNT(*) INTO design_count FROM public.premium_designs 
    WHERE user_id = NEW.user_id;
    
    IF design_count >= COALESCE(user_profile.max_designs, 5) THEN
      RAISE EXCEPTION 'Design limit reached. Upgrade to Pro for unlimited designs.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce design limits
CREATE TRIGGER enforce_design_limit_on_insert
BEFORE INSERT ON public.premium_designs
FOR EACH ROW
EXECUTE FUNCTION public.check_design_limit();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_premium_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_premium_designs_updated_at
BEFORE UPDATE ON public.premium_designs
FOR EACH ROW
EXECUTE FUNCTION public.update_premium_designs_updated_at();

CREATE TRIGGER update_design_collections_updated_at
BEFORE UPDATE ON public.design_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_premium_designs_updated_at();
