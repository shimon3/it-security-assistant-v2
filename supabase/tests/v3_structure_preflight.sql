-- Read-only security preflight for V3 migration.
-- Run AFTER the migration in a disposable Supabase project.
-- This validates structural protections, not cross-user access; do NOT treat it as a substitute for two-user RLS tests.
do $$
declare
  table_name text;
  policy_count integer;
begin
  foreach table_name in array array['organizations','clients','audit_records'] loop
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=table_name
        and c.relkind='r' and c.relrowsecurity and c.relforcerowsecurity
    ) then
      raise exception 'RLS or FORCE RLS missing on public.%',table_name;
    end if;

    select count(*) into policy_count
    from pg_policies
    where schemaname='public' and tablename=table_name and 'authenticated'=any(roles);
    if policy_count < 4 then
      raise exception 'Expected four authenticated CRUD policies for %, got %',table_name,policy_count;
    end if;

    if has_table_privilege('anon',format('public.%I',table_name),'SELECT')
      or has_table_privilege('anon',format('public.%I',table_name),'INSERT')
      or has_table_privilege('anon',format('public.%I',table_name),'UPDATE')
      or has_table_privilege('anon',format('public.%I',table_name),'DELETE')
    then
      raise exception 'Anonymous table privileges unexpectedly granted on %',table_name;
    end if;
  end loop;

  if has_column_privilege('authenticated','public.organizations','owner_user_id','UPDATE') then
    raise exception 'Tenant ownership must be immutable to normal authenticated API clients';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.audit_records'::regclass and contype='f'
      and pg_get_constraintdef(oid) like '%FOREIGN KEY (client_id, organization_id)%'
  ) then
    raise exception 'Audit/client composite tenant FK missing';
  end if;

  raise notice 'V3 structural security preflight passed; two-user behavioral RLS testing still required.';
end $$;
