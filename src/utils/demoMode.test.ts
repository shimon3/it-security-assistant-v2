import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiPost } from './apiClient';
import { DEMO_DOMAIN, demoResponse, setDemoMode } from './demoMode';
import { scoreDomain } from './domainScore';
import { scoreHttpHeaders } from './httpHeadersScore';

describe('demo mode', () => {
  afterEach(() => setDemoMode(false));

  it('answers audit routes locally, without a token or network call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    setDemoMode(true);
    const res = await apiPost<{ domain: string }>('/api/domain-audit', { domain: 'Client.co.il' });
    expect(res.ok).toBe(true);
    expect(res.data?.domain).toBe('client.co.il');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('refuses tools that have no demo data with a clear message', async () => {
    setDemoMode(true);
    const res = await apiPost('/api/vt-ip', { ip: '8.8.8.8' });
    expect(res.ok).toBe(false);
    expect((res.data as { error: string }).error).toMatch(/demo/i);
  });

  it('demo data produces realistic, imperfect grades', () => {
    const d = scoreDomain(demoResponse('/api/domain-audit', { domain: DEMO_DOMAIN }) as Parameters<typeof scoreDomain>[0]);
    const h = scoreHttpHeaders(demoResponse('/api/http-headers', {}) as Parameters<typeof scoreHttpHeaders>[0]);
    expect(['C', 'D']).toContain(d.grade);
    expect(['D', 'E']).toContain(h.grade);
  });
});
