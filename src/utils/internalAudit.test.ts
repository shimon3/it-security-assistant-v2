import { describe, expect, it } from 'vitest';
import { emptyInternalAudit, hasAssessedInternalControls, scoreInternalAudit } from './internalAudit';

describe('internal SMB audit scoring', () => {
  it('does not count unknown or N/A controls as assessed', () => {
    const d = emptyInternalAudit();
    d.answers.mfa = 'na';
    expect(hasAssessedInternalControls(d)).toBe(false);
  });

  it('scores only controls that were actually assessed', () => {
    const d = emptyInternalAudit();
    d.answers.mfa = 'yes';
    d.answers.backups = 'no';

    const s = scoreInternalAudit(d);
    expect(s.score).toBe(Math.round((18 / (18 + 16)) * 100));
    expect(s.findings.map((f) => f.id)).toEqual(expect.arrayContaining(['internal-mfa-ok', 'internal-backups-no']));
  });

  it('gives partial implementation half credit', () => {
    const d = emptyInternalAudit();
    d.answers.mfa = 'partial';

    const s = scoreInternalAudit(d);
    expect(s.score).toBe(50);
    expect(s.findings[0].severity).toBe('medium');
  });

  it('keeps the consultant observation on the generated finding', () => {
    const d = emptyInternalAudit();
    d.answers.mfa = 'no';
    d.observations.mfa = 'Admin accounts are not covered by MFA.';

    const s = scoreInternalAudit(d);
    expect(s.findings[0].detail).toBe('Admin accounts are not covered by MFA.');
  });

  it('gives 100 when every assessed control is in place', () => {
    const d = emptyInternalAudit();
    d.answers.mfa = 'yes';
    d.answers.edr = 'yes';

    const s = scoreInternalAudit(d);
    expect(s.score).toBe(100);
    expect(s.grade).toBe('A');
    expect(s.findings.every((f) => f.severity === 'ok')).toBe(true);
  });
});
