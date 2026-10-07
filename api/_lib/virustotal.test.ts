import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkUrl } from './virustotal';

describe('VirusTotal URL quota behavior', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not auto-submit an unknown URL after a 404 lookup', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await checkUrl('https://unknown.example/', 'test-key');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/urls/'),
      expect.objectContaining({ headers: { 'x-apikey': 'test-key' } }),
    );
    expect(result.httpStatus).toBe(200);
    expect(result.body.status).toBe('unknown');
    expect(result.body.errorMessage).toBe('Not in VirusTotal database');
  });

  it('uses one lookup for a known URL', async () => {
    const body = {
      data: {
        attributes: {
          last_analysis_stats: { malicious: 0, suspicious: 0, harmless: 70, undetected: 5 },
        },
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await checkUrl('https://known.example/', 'test-key');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.httpStatus).toBe(200);
    expect(result.body.status).toBe('clean');
    expect(result.body.total).toBe(75);
  });
});
