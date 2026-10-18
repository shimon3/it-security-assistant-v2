-- V3 isolation smoke test. Execute ONLY in a disposable Supabase database.
-- Prerequisite: replace BOTH placeholders with IDs of two existing Auth TEST users.
-- Use a SQL session with permission to SET ROLE authenticated, e.g. Supabase SQL editor.
-- This runs inside a transaction and rolls back all inserted test data.
-- IMPORTANT: do not run with production identities or production database.
begin;

do $$
begin
  if not exists (select 1 from auth.users where id = '11111111-1111-4111-8111-111111111111'::uuid)
    or not exists (select 1 from auth.users where id = '22222222-2222-4222-8222-222222222222'::uuid)
  then
    raise exception 'Replace placeholder UUIDs with two existing disposable Auth test-user UUIDs';
  end if;
end $$;

-- Transaction-local JWT simulation to exercise PostgREST RLS as user A.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
insert into public.organizations(id, owner_user_id, name)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', auth.uid(), 'V3 isolation test org A');
insert into public.clients(id, organization_id, name)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Client A');
insert into public.audit_records(id, organization_id, client_id, title)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Draft A');

-- User B must not be able to see or change A's data.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $$
begin
  if exists (select 1 from public.organizations where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    or exists (select 1 from public.clients where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
    or exists (select 1 from public.audit_records where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')
  then
    raise exception 'RLS isolation failed: user B can read A data';
  end if;
end $$;

do $$
declare
  n integer;
begin
  update public.audit_records set title='attacker' where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS isolation failed: B updated A audit'; end if;
  delete from public.clients where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS isolation failed: B deleted A client'; end if;
end $$;

-- B may not insert an audit into A's organization.
do $$
begin
  begin
    insert into public.audit_records(organization_id, client_id, title)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'cross-tenant');
    raise exception 'RLS isolation failed: cross-tenant insert unexpectedly succeeded';
  exception
    when insufficient_privilege or foreign_key_violation then null;
  end;
end $$;

-- Switch to A: ownership and records remain visible, no data loss.
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$
begin
  if (select count(*) from public.audit_records where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc') <> 1 then
    raise exception 'RLS isolation failed: A lost its audit';
  end if;
end $$;

rollback;
