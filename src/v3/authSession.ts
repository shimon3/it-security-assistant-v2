/** V3 auth boundary. Never use the service-role key in browser code. */
export interface AuthIdentity { id: string; email?: string }
export interface AuthSession { user: AuthIdentity; access_token: string }
export interface V3AuthClient {
  auth: {
    getUser(): Promise<{ data: { user: AuthIdentity | null }; error: unknown }>;
    signOut(): Promise<{ error: unknown }>;
  };
}
export async function requireAuthenticatedUser(client: V3AuthClient): Promise<AuthIdentity> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) throw new Error('Sign in to access your client audits.');
  return data.user;
}
export async function signOutV3(client: V3AuthClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw new Error('Unable to sign out. Try again.');
}
