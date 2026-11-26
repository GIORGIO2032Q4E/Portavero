-- Pin the existing legacy estimate timestamp trigger to pg_catalog.
-- This prevents role/session search_path changes from affecting the trigger.

create or replace function public.set_estimate_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$function$;
