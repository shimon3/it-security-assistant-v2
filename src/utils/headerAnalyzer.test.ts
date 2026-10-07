import { describe, expect, it } from 'vitest';
import { analyzeHeaders } from './headerAnalyzer';

const SPOOFED = `Received-SPF: fail (google.com: domain of ceo@company.co.il does not designate 203.0.113.9 as permitted sender)
Authentication-Results: mx.google.com; dkim=fail; spf=fail; dmarc=fail (p=REJECT)
From: "CEO" <ceo@company.co.il>
Reply-To: ceo.private@gmail-secure.top
Return-Path: <bounce@mailer-xyz.top>
Message-ID: <abc123@mailer-xyz.top>
Subject: Urgent wire transfer`;

const CLEAN = `Received-SPF: pass (google.com: domain of news@company.co.il designates 198.51.100.4 as permitted sender)
Authentication-Results: mx.google.com; dkim=pass; spf=pass; dmarc=pass
From: Company News <news@company.co.il>
Return-Path: <news@company.co.il>
Message-ID: <20261007.1234@company.co.il>`;

describe('analyzeHeaders', () => {
  it('detects SPF failure on a spoofed CEO email', () => {
    const r = analyzeHeaders(SPOOFED);
    expect(r.detections.some((d) => d.header === 'Received-SPF')).toBe(true);
  });

  it('detects a Message-ID domain that does not match the sender', () => {
    const r = analyzeHeaders(SPOOFED);
    expect(r.detections.some((d) => d.header === 'Message-ID' && /mailer-xyz\.top/.test(d.reason))).toBe(true);
  });

  it('scores the spoofed email higher than the clean one', () => {
    expect(analyzeHeaders(SPOOFED).score).toBeGreaterThan(analyzeHeaders(CLEAN).score);
  });

  it('reports no SPF or Message-ID problem on clean headers', () => {
    const r = analyzeHeaders(CLEAN);
    expect(r.detections.some((d) => d.header === 'Received-SPF')).toBe(false);
    expect(r.detections.some((d) => d.header === 'Message-ID')).toBe(false);
  });

  it('extracts addresses with hyphens and plus signs', () => {
    const raw = `From: <first-last+tag@my-company.co.il>\nMessage-ID: <x@other-domain.com>`;
    const r = analyzeHeaders(raw);
    const msg = r.detections.find((d) => d.header === 'Message-ID');
    expect(msg?.reason).toContain('my-company.co.il');
  });

  it('caps the score at 100 and handles empty input', () => {
    expect(analyzeHeaders(SPOOFED.repeat(10)).score).toBeLessThanOrEqual(100);
    expect(analyzeHeaders('').detections).toEqual([]);
  });
});
