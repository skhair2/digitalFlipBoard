-- Promote soumu.stud@gmail.com to the pro subscription tier
WITH updated AS (
    UPDATE public.profiles
    SET subscription_tier = 'pro',
        updated_at = timezone('utc', now())
    WHERE lower(email) = 'soumu.stud@gmail.com'
    RETURNING id
)
INSERT INTO public.profiles (id, email, full_name, subscription_tier, created_at, updated_at)
SELECT u.id,
       lower(u.email),
       COALESCE(u.raw_user_meta_data->>'full_name', 'soumu.stud'),
       'pro',
       timezone('utc', now()),
       timezone('utc', now())
FROM auth.users u
WHERE lower(u.email) = 'soumu.stud@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM updated)
ON CONFLICT (id) DO UPDATE
SET subscription_tier = 'pro',
    updated_at = excluded.updated_at;
