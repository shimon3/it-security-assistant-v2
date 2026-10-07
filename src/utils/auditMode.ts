// "Audit mode" = the tool is being used for a paid client mission.
// In audit mode:
//  - tools backed by APIs whose terms forbid commercial use are hidden
//    (VirusTotal public API, Qualys SSL Labs);
//  - analysed emails are not kept in browser history;
//  - exported reports are anonymised by default.
// The switch itself is a per-browser preference, kept in localStorage.

import { useSyncExternalStore } from 'react';
import type { Tool } from '../components/Sidebar';

const KEY = 'itsa_audit_mode';
const EVENT = 'itsa-audit-mode-change';

/** Tools that rely on non-commercial APIs: personal use only. */
export const PERSONAL_ONLY_TOOLS: readonly Tool[] = ['url', 'hash', 'ip', 'domain', 'ssl'];

export function isPersonalOnly(tool: Tool): boolean {
  return PERSONAL_ONLY_TOOLS.includes(tool);
}

export function isAuditMode(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setAuditMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the switch still applies until reload via the event below.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useAuditMode(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, isAuditMode, () => false);
  return [on, setAuditMode];
}
