import { describe, expect, it } from 'vitest';
import {
  INTERNAL_CATEGORIES,
  INTERNAL_CONTROLS,
  emptyInternalAudit,
  hasAssessedInternalControls,
  internalScoreCaps,
  isInternalAuditComplete,
  scoreInternalAudit,
} from './internalAudit';

describe('internal SMB audit scoring', () => {
  it('organizes controls into the expected audit categories', () => {
    expect(INTERNAL_CATEGORIES.map((c) => c.id)).toEqual([
      'identity',
      'endpoints',
      'backup',
      'network',
      'remote',
      'data',
      'people',
    ]);
    expect(INTERNAL_CONTROLS).toHaveLength(20);
    expect(INTERNAL_CONTROLS.every((control) => INTERNAL_CATEGORIES.some((category) => category.id === control.category))).toBe(true);
  });

  it('does not count unknown or N/A controls as assessed', () => {
    const d = emptyInternalAudit();
    d.answers.mfa = 'na';
    expect(hasAssessedInternalControls(d)).toBe(false);
    expect(isInternalAuditComplete(d)).toBe(false);
  });

  it('scores only controls that were actually assessed', () => {
    const d = emptyInternalAudit();
    d.answers.mfa = 'yes';
    d.answers.backups = 'no';

    const s = scoreInternalAudit(d);
    expect(s.score).toBe(52); // 14/(14+13)=51.85; the 74-point backup cap does not lower an already-lower score
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

  it('stores evidence status separately from the security answer', () => {
    const d = emptyInternalAudit();
    d.answers.mfa = 'yes';
    d.evidence.mfa = 'verified';

    const before = scoreInternalAudit(d);
    d.evidence.mfa = 'client';
    const after = scoreInternalAudit(d);

    expect(before.score).toBe(100);
    expect(after.score).toBe(100);
    expect(d.evidence.mfa).toBe('client');
  });

  it('defaults evidence status to unverified for every control', () => {
    const d = emptyInternalAudit();
    expect(INTERNAL_CONTROLS.every((control) => d.evidence[control.id] === 'unverified')).toBe(true);
  });

  it('prevents an A when MFA is completely missing', () => {
    const d = emptyInternalAudit();
    for (const control of INTERNAL_CONTROLS) d.answers[control.id] = 'yes';
    d.answers.mfa = 'no';

    const caps = internalScoreCaps(d);
    const s = scoreInternalAudit(d);

    expect(caps.some((cap) => cap.controlId === 'mfa' && cap.maxScore === 89)).toBe(true);
    expect(s.score).toBe(89);
    expect(s.grade).toBe('B');
  });

  it('prevents A and B when adequate backups are completely missing', () => {
    const d = emptyInternalAudit();
    for (const control of INTERNAL_CONTROLS) d.answers[control.id] = 'yes';
    d.answers.backups = 'no';

    const s = scoreInternalAudit(d);
    expect(s.score).toBe(74);
    expect(s.grade).toBe('C');
  });

  it('uses the strictest cap when several critical controls are missing', () => {
    const d = emptyInternalAudit();
    for (const control of INTERNAL_CONTROLS) d.answers[control.id] = 'yes';
    d.answers.mfa = 'no';
    d.answers.edr = 'no';
    d.answers.remoteAccess = 'no';

    expect(internalScoreCaps(d).map((cap) => cap.maxScore)).toEqual([74, 89, 89]);
    expect(scoreInternalAudit(d).score).toBe(74);
  });

  it('gives 100 when every assessed control is in place', () => {
    const d = emptyInternalAudit();
    for (const control of INTERNAL_CONTROLS) d.answers[control.id] = 'yes';

    const s = scoreInternalAudit(d);
    expect(s.score).toBe(100);
    expect(s.grade).toBe('A');
    expect(s.findings.every((f) => f.severity === 'ok')).toBe(true);
    expect(isInternalAuditComplete(d)).toBe(true);
  });
});
