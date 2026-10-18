export type EmailPlatform = '' | 'microsoft365' | 'googleWorkspace' | 'other' | 'none';
export type Presence = '' | 'yes' | 'no' | 'unknown';

export interface ClientEnvironment {
  users: string;
  endpoints: string;
  emailPlatform: EmailPlatform;
  servers: Presence;
  endpointProtection: string;
  backupSolution: string;
  remoteAccess: string;
}

export function emptyClientEnvironment(): ClientEnvironment {
  return {
    users: '',
    endpoints: '',
    emailPlatform: '',
    servers: '',
    endpointProtection: '',
    backupSolution: '',
    remoteAccess: '',
  };
}

export function hasClientEnvironment(data: ClientEnvironment | null): boolean {
  if (!data) return false;
  return Object.values(data).some((value) => value.trim() !== '');
}

export function emailPlatformLabelHe(value: EmailPlatform): string {
  if (value === 'microsoft365') return 'Microsoft 365';
  if (value === 'googleWorkspace') return 'Google Workspace';
  if (value === 'other') return 'אחר';
  if (value === 'none') return 'ללא מערכת דואר';
  return 'לא צוין';
}

export function presenceLabelHe(value: Presence): string {
  if (value === 'yes') return 'כן';
  if (value === 'no') return 'לא';
  if (value === 'unknown') return 'לא ידוע';
  return 'לא צוין';
}
