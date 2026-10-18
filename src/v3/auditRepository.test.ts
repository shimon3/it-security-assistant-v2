import { describe, expect, it } from 'vitest';
import { auditDraftPayload, assertSaved } from './auditRepository';
import type { AuditSession } from '../utils/auditSession';

describe('V3 audit draft persistence', () => {
  it('saves only explicitly allowed assessment fields', () => {
    const session: AuditSession = {
      clientName: 'Example shop', domain: 'example.test',
      internalAudit: null, clientEnvironment: null, domainAudit: null, httpHeaders: null,
    };
    expect(auditDraftPayload(session)).toEqual({
      schemaVersion: 1, clientName: 'Example shop', domain: 'example.test',
      internalAudit: null, clientEnvironment: null,
    });
    expect(auditDraftPayload(session)).not.toHaveProperty('domainAudit');
    expect(auditDraftPayload(session)).not.toHaveProperty('httpHeaders');
  });

  it('does not expose database error details to the user', () => {
    expect(() => assertSaved({ data: null, error: { message: 'private SQL details' } })).toThrow(
      'Unable to save audit. Check access and try again.',
    );
  });
});
