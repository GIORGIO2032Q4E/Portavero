-- Portavero shared API rate limits.
-- Apply this migration before deploying code that calls the RPC.
-- The caller uses SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY).
-- Only HMAC-SHA256 bucket IDs are stored; raw client IP addresses are not stored.

create table if not exists public.portavero_rate_limits (
  bucket_key text primary key check (bucket_key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null
);

create index if not exists portavero_rate_limits_expires_at_idx
  on public.portavero_rate_limits (expires_at);

alter table public.portavero_rate_limits enable row level security;

revoke all on table public.portavero_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.portavero_rate_limits to service_role;

create or replace function public.consume_portavero_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_count integer;
  v_reset timestamptz;
begin
  if p_bucket_key is null
     or p_bucket_key !~ '^[0-9a-f]{64}$'
     or p_limit is null
     or p_limit < 1
     or p_window_seconds is null
     or p_window_seconds < 1
     or p_window_seconds > 86400 then
    raise exception 'Invalid Portavero rate-limit arguments'
      using errcode = '22023';
  end if;

  insert into public.portavero_rate_limits as stored (
    bucket_key,
    window_started_at,
    request_count,
    expires_at
  )
  values (
    p_bucket_key,
    v_now,
    1,
    v_now + pg_catalog.make_interval(secs => p_window_seconds) + interval '1 day'
  )
  on conflict (bucket_key) do update
  set
    window_started_at = case
      when stored.window_started_at + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
        then v_now
      else stored.window_started_at
    end,
    request_count = case
      when stored.window_started_at + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
        then 1
      else stored.request_count + 1
    end,
    expires_at = case
      when stored.window_started_at + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
        then v_now + pg_catalog.make_interval(secs => p_window_seconds) + interval '1 day'
      else stored.expires_at
    end
  returning
    request_count,
    window_started_at + pg_catalog.make_interval(secs => p_window_seconds)
  into v_count, v_reset;

  -- Opportunistically prune a small batch of expired identifiers.
  if pg_catalog.random() < 0.01 then
    delete from public.portavero_rate_limits
    where bucket_key in (
      select expired.bucket_key
      from public.portavero_rate_limits as expired
      where expired.expires_at <= v_now
      order by expired.expires_at
      limit 200
    );
  end if;

  return query
    select
      v_count <= p_limit,
      greatest(p_limit - v_count, 0),
      v_reset;
end;
$function$;

revoke all on function public.consume_portavero_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_portavero_rate_limit(text, integer, integer)
  to service_role;
