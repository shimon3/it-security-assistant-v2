import { INTERNAL_CONTROLS, type InternalAuditData } from './internalAudit';

/** The printed appendix omits unanswered controls; they remain unassessed in coverage totals. */
export function printableInternalControls(data: InternalAuditData | null) {
  if (!data) return [];
  return INTERNAL_CONTROLS.filter(control => (data.answers?.[control.id] ?? 'unknown') !== 'unknown');
}
