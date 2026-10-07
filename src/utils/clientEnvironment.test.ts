import { describe, expect, it } from 'vitest';
import {
  emailPlatformLabelHe,
  emptyClientEnvironment,
  hasClientEnvironment,
  presenceLabelHe,
} from './clientEnvironment';

describe('client environment profile', () => {
  it('starts empty and is not considered present', () => {
    const env = emptyClientEnvironment();
    expect(hasClientEnvironment(env)).toBe(false);
  });

  it('is considered present when one contextual field is filled', () => {
    const env = emptyClientEnvironment();
    env.endpoints = '25';
    expect(hasClientEnvironment(env)).toBe(true);
  });

  it('formats report labels without affecting scoring logic', () => {
    expect(emailPlatformLabelHe('microsoft365')).toBe('Microsoft 365');
    expect(emailPlatformLabelHe('googleWorkspace')).toBe('Google Workspace');
    expect(presenceLabelHe('yes')).toBe('כן');
    expect(presenceLabelHe('unknown')).toBe('לא ידוע');
  });
});
