import { describe, expect, it } from 'vitest';
import { emptyInternalAudit, withInternalAnswer } from './internalAudit';
import { printableInternalControls } from './printableInternalControls';

describe('printed internal audit appendix', () => {
  it('does not print unassessed controls', () => {
    expect(printableInternalControls(emptyInternalAudit())).toEqual([]);
    expect(printableInternalControls(null)).toEqual([]);
  });

  it('prints answered controls in questionnaire order, including N/A', () => {
    let audit = emptyInternalAudit();
    audit = withInternalAnswer(audit, 'backups', 'no');
    audit = withInternalAnswer(audit, 'mfa', 'yes');
    audit = withInternalAnswer(audit, 'edr', 'partial');
    audit = withInternalAnswer(audit, 'wifi', 'na');
    expect(printableInternalControls(audit).map(control => control.id)).toEqual(['mfa', 'edr', 'backups', 'wifi']);
  });

  it('removes a control returned to not verified', () => {
    let audit = withInternalAnswer(emptyInternalAudit(), 'mfa', 'yes');
    audit = withInternalAnswer(audit, 'mfa', 'unknown');
    expect(printableInternalControls(audit)).toEqual([]);
  });
});
