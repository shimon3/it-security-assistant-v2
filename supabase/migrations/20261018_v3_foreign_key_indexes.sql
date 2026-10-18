-- Cover foreign keys reported by the Supabase performance advisor.
create index if not exists organizations_owner_idx on public.organizations(owner_user_id);
create index if not exists audit_records_org_idx on public.audit_records(organization_id);
create index if not exists audit_records_client_org_fk_idx on public.audit_records(client_id, organization_id);
