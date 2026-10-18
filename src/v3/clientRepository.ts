import type { V3Client } from './clientModels';

export interface DbResult<T> { data: T | null; error: { message: string } | null }
interface ClientQuery<T> {
  eq(column: string, value: string): ClientQuery<T>;
  order(column: string, options: { ascending: boolean }): ClientQuery<T>;
  select(columns: string): ClientQuery<T>;
  single(): Promise<DbResult<T>>;
  then<TResult1 = DbResult<T>>(onfulfilled?: ((value: DbResult<T>) => TResult1 | PromiseLike<TResult1>) | null): Promise<TResult1>;
}
export interface V3ClientDatabase {
  from(table: 'clients'): {
    select(columns: string): ClientQuery<V3Client[]>;
    insert(row: { organization_id: string; name: string; domain: string }): ClientQuery<V3Client>;
  };
}
function validTenantId(tenantId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId))
    throw new Error('Select a valid organization.');
  return tenantId;
}
export async function listClients(db: V3ClientDatabase, organizationId: string): Promise<V3Client[]> {
  const tenantId = validTenantId(organizationId);
  const result = await db.from('clients').select('id,organization_id,name,domain')
    .eq('organization_id', tenantId).order('name', { ascending: true });
  if (result.error || !Array.isArray(result.data)) throw new Error('Unable to load clients.');
  return result.data;
}
export async function createClient(db: V3ClientDatabase, organizationId: string, name: string, domain: string): Promise<V3Client> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 160 || domain.length > 255) throw new Error('Invalid client details.');
  const tenantId = validTenantId(organizationId);
  const result = await db.from('clients').insert({
    organization_id: tenantId, name: trimmed, domain: domain.trim(),
  }).select('id,organization_id,name,domain').single();
  if (result.error || !result.data) throw new Error('Unable to create client.');
  return result.data;
}
