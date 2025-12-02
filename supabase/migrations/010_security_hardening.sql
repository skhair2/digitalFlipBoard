-- Security hardening for Supabase schema
-- 1. Ensure RLS is enabled everywhere that is exposed to PostgREST
-- 2. Refresh RLS policies for premium design tables and admin surfaces
-- 3. Lock search_path for security definer functions

-- === Premium Designs & Related Tables ===
ALTER TABLE public.premium_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_collection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_likes ENABLE ROW LEVEL SECURITY;

-- premium_designs policies
DROP POLICY IF EXISTS "premium_designs_select_owner" ON public.premium_designs;
DROP POLICY IF EXISTS "premium_designs_insert_owner" ON public.premium_designs;
DROP POLICY IF EXISTS "premium_designs_update_owner" ON public.premium_designs;
DROP POLICY IF EXISTS "premium_designs_delete_owner" ON public.premium_designs;

CREATE POLICY "premium_designs_select_owner" ON public.premium_designs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "premium_designs_insert_owner" ON public.premium_designs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "premium_designs_update_owner" ON public.premium_designs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "premium_designs_delete_owner" ON public.premium_designs
FOR DELETE
USING (auth.uid() = user_id);

-- design_versions policies
DROP POLICY IF EXISTS "design_versions_select_owner" ON public.design_versions;
DROP POLICY IF EXISTS "design_versions_modify_owner" ON public.design_versions;

CREATE POLICY "design_versions_select_owner" ON public.design_versions
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.premium_designs d
        WHERE d.id = design_id
          AND d.user_id = auth.uid()
    )
);

CREATE POLICY "design_versions_modify_owner" ON public.design_versions
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.premium_designs d
        WHERE d.id = design_id
          AND d.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.premium_designs d
        WHERE d.id = design_id
          AND d.user_id = auth.uid()
    )
);

-- design_collections policies
DROP POLICY IF EXISTS "design_collections_select" ON public.design_collections;
DROP POLICY IF EXISTS "design_collections_modify" ON public.design_collections;

CREATE POLICY "design_collections_select" ON public.design_collections
FOR SELECT
USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "design_collections_modify" ON public.design_collections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- design_collection_members policies
DROP POLICY IF EXISTS "collection_members_select" ON public.design_collection_members;
DROP POLICY IF EXISTS "collection_members_modify" ON public.design_collection_members;

CREATE POLICY "collection_members_select" ON public.design_collection_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.design_collections c
        WHERE c.id = collection_id
          AND (c.user_id = auth.uid() OR c.is_public = TRUE)
    )
);

CREATE POLICY "collection_members_modify" ON public.design_collection_members
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.design_collections c
        WHERE c.id = collection_id
          AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.design_collections c
        WHERE c.id = collection_id
          AND c.user_id = auth.uid()
    )
);

-- design_likes policies
DROP POLICY IF EXISTS "design_likes_select_owner" ON public.design_likes;
DROP POLICY IF EXISTS "design_likes_insert_owner" ON public.design_likes;
DROP POLICY IF EXISTS "design_likes_delete_owner" ON public.design_likes;

CREATE POLICY "design_likes_select_owner" ON public.design_likes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "design_likes_insert_owner" ON public.design_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "design_likes_delete_owner" ON public.design_likes
FOR DELETE
USING (auth.uid() = user_id);

-- === Admin tables ===
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_system_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_activity_log_select" ON public.admin_activity_log;
DROP POLICY IF EXISTS "admin_activity_log_insert" ON public.admin_activity_log;
DROP POLICY IF EXISTS "admin_system_stats_select" ON public.admin_system_stats;
DROP POLICY IF EXISTS "admin_roles_all" ON public.admin_roles;

CREATE POLICY "admin_activity_log_select" ON public.admin_activity_log
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "admin_activity_log_insert" ON public.admin_activity_log
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "admin_system_stats_select" ON public.admin_system_stats
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "admin_roles_all" ON public.admin_roles
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- === Harden security definer functions ===
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.check_user_exists(text) SET search_path = public;
