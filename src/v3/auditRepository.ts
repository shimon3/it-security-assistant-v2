/**
 * V3 audit persistence layer. Intentionally independent of production V2.
 * Requires an authenticated Supabase client; never accept caller-supplied
 * owner user IDs or use service-role credentials in browser code.
 */
import type { AuditSession } from '../utils/auditSession';

export interface V3SupabaseDataClient {
  from(table: 'organizations' | 'clients' | 'audit_records'): {
    select(columns?: string): any;
    insert(values: Record<string, unknown>): any;
    update(values: Record<string, unknown>): any;
  };
}

export interface ClientRecord {
  id: string;
  organization_id: string;
  name: string;
  domain: string;
}

export interface SavedAudit {
  id: string;
  organization_id: string;
  client_id: string;
  title: string;
  status: 'draft' | 'completed';
  questionnaire: Record<string, unknown>;
}

/** Allowlist the minimum audit fields for saved draft data. */
export function auditDraftPayload(session: AuditSession): Record<string, unknown> {
  return {
    schemaVersion: 1,
    clientName: session.clientName,
    domain: session.domain,
    internalAudit: session.internalAudit,
    clientEnvironment: session.clientEnvironment,
  };
}

/** Convert expected Supabase/PostgREST errors into safe UI messages. */
export function assertSaved<T>(response: { data: T | null; error: { message: string } | null }): T {
  if (response.error) throw new Error('Unable to save audit. Check access and try again.');
  if (response.data === null) throw new Error('Audit was not saved.');
  return response.data;
}

/**
 * RLS enforces ownership. The composite client/organization FK prevents
 * cross-tenant references even if an API consumer sends arbitrary IDs.
 */
export async function saveDraft(
  db: V3SupabaseDataClient,
  audit: Pick<SavedAudit, 'id' | 'organization_id' | 'client_id'>,
  session: AuditSession,
): Promise<SavedAudit> {
  const response = await db.from('audit_records')
    .update({ questionnaire: auditDraftPayload(session) })
    .eq('id', audit.id)
    .eq('organization_id', audit.organization_id)
    .eq('client_id', audit.client_id)
    .select('id,organization_id,client_id,title,status,questionnaire')
    .single();
  return assertSaved(response as { data: SavedAudit | null; error: { message: string } | null });
}
