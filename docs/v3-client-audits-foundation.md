# V3 — Client management and saved audits (foundation)

## Status
**Schema proposal only. Not deployed, not connected to production, no real client data migrated.**
V2 remains unchanged: the existing audit session is memory-only and clears when the tab/session is cleared.

## First usable V3 milestone
1. Sign-in with Supabase Auth; block all client/audit screens unless signed in.
2. A user creates an organization (tenant) and client.
3. Save and reopen a draft questionnaire assigned to the selected client.
4. Generate a report from the saved audit after reloading the browser.
5. Verify isolation with *two different authenticated accounts* before any real customer records are imported.

## Isolation model
- `organizations.owner_user_id` is immutable to regular API clients.
- Clients belong to exactly one organization.
- Audit records reference a client **and that same organization** through a composite foreign key.
- Read/write/delete access requires organization ownership through Postgres RLS.
- No anonymous table grants; no service-role key in the browser.
- Team sharing, MSP-managed access and SMB owner access are **not enabled yet**. These require separate membership roles and security tests, not just a visible toggle.

## Security acceptance tests (must run against a real test Supabase project)
- Auth user A can insert and read its own organization, client and audit.
- Auth user B cannot read, update or delete A's organization/client/audit.
- B cannot insert an audit with A's organization ID.
- A cannot save an audit referencing a client from B's organization.
- Anonymous queries cannot read data.
- An owner cannot change `owner_user_id` through the public API.
- Owner can create multiple clients without audits leaking between them.
- Verify that export/print is scoped to the selected client and only the selected audit.
- Test data retention and deletion; verify backups and policy for confidential evidence.

## Remaining work
- Choose/authorize a Supabase project; run and test the migration there.
- Add Supabase Auth client, session refresh, proper logout and protected routing.
- Add tenant/client picker, CRUD UI, draft audit persistence and optimistic concurrency/versioning.
- Implement safe migration from in-memory audit only after explicit user action.
- Add full tenant isolation tests in CI with a disposable database.
- Threat-model file uploads, API authorization, retention, and role delegation before release.

**Deployment gate:** Do not merge or publish until Auth/RLS are integration-tested with two identities. This SQL has not been executed yet.

## SQL preflight added
After applying `supabase/migrations/20261018_v3_foundation.sql` in a disposable Supabase instance, run `supabase/tests/v3_structure_preflight.sql` in its SQL editor. The script fails if tables lack RLS/forced RLS, the owner column is writable, anonymous users have table privileges, four authenticated CRUD policies are missing, or the client/tenant composite foreign key is absent. The preflight checks **database configuration only**; it does not demonstrate access isolation. Two-account behavioral tests remain a mandatory release gate.

## Two-user RLS smoke test (added)
Run `supabase/tests/v3_two_user_rls_smoke.sql` **only in a disposable test project**, after applying the migration. Replace BOTH test-user UUID placeholders with UUIDs of existing disposable Supabase Auth test users. The test impersonates the `authenticated` role, creates a tenant/client/audit for account A, confirms account B cannot read, edit or delete them or insert a cross-tenant audit, and checks A can still read its record. All inserts are rolled back. Do not use real customer accounts or production projects.

This test is source-controlled but **has not been executed against a database**. Before release, also run browser/API integration tests with two real login sessions (including logout/token refresh). The SQL editor uses elevated privileges until `SET ROLE authenticated` and therefore cannot replace an end-to-end test.
