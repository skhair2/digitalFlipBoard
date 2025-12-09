-- Coupon System Tables
-- Creates tables for coupon management, redemptions, and templates

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  current_uses INTEGER DEFAULT 0,
  max_uses INTEGER,
  expiry_date TIMESTAMP WITH TIME ZONE,
  applicable_tier TEXT DEFAULT 'all' CHECK (applicable_tier IN ('free', 'pro', 'enterprise', 'all')),
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Coupon Redemptions Table (Usage Tracking)
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_applied DECIMAL(10, 2),
  transaction_id TEXT,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(coupon_id, user_id)
);

-- Coupon Templates Table (Reusable Configurations)
CREATE TABLE IF NOT EXISTS public.coupon_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER,
  applicable_tier TEXT DEFAULT 'all',
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry ON public.coupons(expiry_date);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed ON public.coupon_redemptions(redeemed_at);
CREATE INDEX IF NOT EXISTS idx_templates_name ON public.coupon_templates(template_name);

-- Enable Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Coupons
-- Admins can create and manage coupons
CREATE POLICY "admins_can_create_coupons" ON public.coupons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );

-- Anyone can view active coupons
CREATE POLICY "anyone_can_view_active_coupons" ON public.coupons
  FOR SELECT
  USING (is_active = true);

-- Admins can view all coupons
CREATE POLICY "admins_can_view_all_coupons" ON public.coupons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );

-- Admins can update coupons
CREATE POLICY "admins_can_update_coupons" ON public.coupons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );

-- Admins can delete coupons
CREATE POLICY "admins_can_delete_coupons" ON public.coupons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );

-- RLS Policies for Coupon Redemptions
-- Users can view own redemptions
CREATE POLICY "users_can_view_own_redemptions" ON public.coupon_redemptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all redemptions
CREATE POLICY "admins_can_view_all_redemptions" ON public.coupon_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );

-- Users can insert their redemptions
CREATE POLICY "users_can_insert_redemptions" ON public.coupon_redemptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Coupon Templates
-- Only admins can view templates
CREATE POLICY "admins_can_view_templates" ON public.coupon_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );

-- Only admins can create templates
CREATE POLICY "admins_can_create_templates" ON public.coupon_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );

-- Only admins can update templates
CREATE POLICY "admins_can_update_templates" ON public.coupon_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );

-- Only admins can delete templates
CREATE POLICY "admins_can_delete_templates" ON public.coupon_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
        OR auth.users.raw_app_meta_data->>'role' = 'superadmin')
    )
  );
