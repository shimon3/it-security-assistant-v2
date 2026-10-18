-- V3 foundation: per-user tenant isolation. Apply only after security review.
-- Phase 1 supports tenant owners. Team invitations / roles are deliberately NOT enabled.
-- Run this migration inside a dedicated Supabase project (not the V2 production app).

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (id, owner_user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  domain text not null default '',
  created_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.audit_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  client_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  status text not null default 'draft' check (status in ('draft', 'completed')),
  questionnaire jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, organization_id) references public.clients(id, organization_id) on delete cascade,
  foreign key (organization_id) references public.organizations(id) on delete cascade
);

create index audit_records_client_idx on public.audit_records(client_id, created_at desc);
create index clients_org_idx on public.clients(organization_id);

-- SECURITY: never allow direct access without the requesting user's ownership.
alter table public.organizations enable row level security;
alter table public.clients enable row level security;
alter table public.audit_records enable row level security;
alter table public.organizations force row level security;
alter table public.clients force row level security;
alter table public.audit_records force row level security;

create policy org_select on public.organizations for select to authenticated
  using (owner_user_id = (select auth.uid()));
create policy org_insert on public.organizations for insert to authenticated
  with check (owner_user_id = (select auth.uid()));
create policy org_update on public.organizations for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));
create policy org_delete on public.organizations for delete to authenticated
  using (owner_user_id = (select auth.uid()));

create policy client_select on public.clients for select to authenticated
  using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));
create policy client_insert on public.clients for insert to authenticated
  with check (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));
create policy client_update on public.clients for update to authenticated
  using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));
create policy client_delete on public.clients for delete to authenticated
  using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));

create policy audit_select on public.audit_records for select to authenticated
  using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));
create policy audit_insert on public.audit_records for insert to authenticated
  with check (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));
create policy audit_update on public.audit_records for update to authenticated
  using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));
create policy audit_delete on public.audit_records for delete to authenticated
  using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));

-- Least-privilege column grants: organization ownership is immutable via API.
revoke all on public.organizations, public.clients, public.audit_records from anon, authenticated;
grant select, insert, delete on public.organizations to authenticated;
grant update (name) on public.organizations to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.audit_records to authenticated;

-- Ensure no V3 client keys or service-role tokens are bundled into the browser.
-- Supabase 'anon' (publishable) key is public but must rely on these RLS policies.
