-- Saved estimates are accessed only after the server validates an authenticated user.
-- Remove default anonymous grants; keep authenticated RLS policies unchanged.
revoke all privileges on table public.saved_estimates from anon, public;
