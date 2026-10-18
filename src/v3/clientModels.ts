/** Minimal V3 client data model. Tenant IDs are required for every write. */
export interface V3Organization { id: string; name: string; owner_user_id: string }
export interface V3Client { id: string; organization_id: string; name: string; domain: string }
export interface V3AuditSummary {
  id: string; organization_id: string; client_id: string;
  title: string; status: 'draft' | 'completed'; created_at: string;
}
export function validClientName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 160;
}
export function clientTitle(name: string, domain: string): string {
  const clean = name.trim();
  return domain.trim() ? `${clean} — ${domain.trim()}` : clean;
}
