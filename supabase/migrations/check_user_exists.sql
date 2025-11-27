-- Create a secure function to check if a user exists by email
-- This function runs with security definer to access the auth.users table
-- but only returns a boolean to prevent data leakage.

create or replace function public.check_user_exists(email_to_check text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from auth.users
    where email = email_to_check
  );
end;
$$;

-- Grant execute permission to public (anon and authenticated)
grant execute on function public.check_user_exists(text) to public;
