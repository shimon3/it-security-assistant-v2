// In-memory results of the current audit, shared between the check pages and the report.
// Nothing is written to browser storage: closing the tab clears client data.

import { useSyncExternalStore } from 'react';
import type { DomainAuditData } from './domainScore';
import type { HttpHeadersData } from './httpHeadersScore';
import type { InternalAuditData } from './internalAudit';
import type { ClientEnvironment } from './clientEnvironment';

export interface AuditSession {
  /** Last domain typed on any audit page, to prefill the others. */
  domain: string;
  clientName: string;
  domainAudit: DomainAuditData | null;
  httpHeaders: HttpHeadersData | null;
  internalAudit: InternalAuditData | null;
  clientEnvironment: ClientEnvironment | null;
}

let state: AuditSession = { domain: '', clientName: '', domainAudit: null, httpHeaders: null, internalAudit: null, clientEnvironment: null };
const listeners = new Set<() => void>();

export function getSession(): AuditSession {
  return state;
}

export function updateSession(patch: Partial<AuditSession>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function clearSession(): void {
  updateSession({ domain: '', clientName: '', domainAudit: null, httpHeaders: null, internalAudit: null, clientEnvironment: null });
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAuditSession(): AuditSession {
  return useSyncExternalStore(subscribe, getSession, getSession);
}
