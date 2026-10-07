import { describe, expect, it } from 'vitest';
import { anonymizeText, generateTextReport, maskEmail, maskUrl } from './exportReport';
import { analyzeEmail } from './emailAnalyzer';

describe('report anonymisation', () => {
  it('masks email addresses but keeps the domain', () => {
    expect(maskEmail('paul.levy@client.co.il')).toBe('p***@client.co.il');
    expect(maskEmail('a@b.io and dana+x@corp.com')).toBe('a***@b.io and d***@corp.com');
  });

  it('keeps only scheme and host of a URL', () => {
    expect(maskUrl('https://evil.example/login?user=paul')).toBe('https://evil.example/…');
    expect(maskUrl('http://ok.com')).toBe('http://ok.com');
  });

  it('removes personal data from a full report', () => {
    const result = analyzeEmail('paul.levy@client.co.il', 'Verify now: http://paypa1-login.xyz/reset?email=paul.levy@client.co.il');
    const plain = generateTextReport('paul.levy@client.co.il', result, null, null);
    const anon = generateTextReport('paul.levy@client.co.il', result, null, null, { anonymize: true });
    expect(plain).toContain('paul.levy@client.co.il');
    expect(anon).not.toContain('paul.levy');
    expect(anon).not.toContain('reset?email');
    expect(anon).toContain('p***@client.co.il');
  });

  it('leaves text without personal data unchanged', () => {
    expect(anonymizeText('Risk Level  : HIGH')).toBe('Risk Level  : HIGH');
  });
});
