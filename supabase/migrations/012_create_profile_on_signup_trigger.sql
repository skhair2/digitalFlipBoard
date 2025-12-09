-- Create PostgreSQL function to automatically create profile when auth user is created
-- This solves the RLS issue where newly signed up users can't write to profiles table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Extract user metadata - check for full_name, then name, then empty string
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    signup_method,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'signup_method', 'password'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN EXCLUDED.full_name IS NOT NULL AND EXCLUDED.full_name != '' THEN EXCLUDED.full_name
      WHEN profiles.full_name IS NOT NULL AND profiles.full_name != '' THEN profiles.full_name
      ELSE ''
    END,
    signup_method = COALESCE(EXCLUDED.signup_method, profiles.signup_method),
    email_verified = CASE WHEN EXCLUDED.email_verified THEN TRUE ELSE profiles.email_verified END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create trigger to call the function when new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also update profile when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = TRUE, updated_at = NOW()
  WHERE id = NEW.id AND email_verified = FALSE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmed();
