import { describe, expect, it } from 'vitest';
import { checkPasswordStrength } from './passwordChecker';

describe('checkPasswordStrength', () => {
  it('rejects an empty password', () => {
    expect(checkPasswordStrength('').score).toBe(0);
  });

  it('rejects common passwords whatever their case', () => {
    for (const p of ['password', 'Password', 'QWERTY', 'admin', 'password123']) {
      const r = checkPasswordStrength(p);
      expect(r.score).toBe(0);
      expect(r.timeToCrack).toBe('Instantly');
    }
  });

  it('rates a long random passphrase as strong', () => {
    const r = checkPasswordStrength('Kx9!vR2#tLq7@zM4$wN8');
    expect(r.score).toBeGreaterThanOrEqual(3);
  });

  it('gives a higher score to a longer password of the same kind', () => {
    const short = checkPasswordStrength('aZ3!kq');
    const long = checkPasswordStrength('aZ3!kqP9#mX2@vL5');
    expect(long.score).toBeGreaterThanOrEqual(short.score);
    expect(long.entropy).toBeGreaterThan(short.entropy);
  });

  it('only returns labels that match the score', () => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    for (const p of ['a', 'abcdefgh', 'Abcdefgh1', 'Abcdefgh1!xyz', 'Kx9!vR2#tLq7@zM4$wN8']) {
      const r = checkPasswordStrength(p);
      expect(r.label).toBe(labels[r.score]);
    }
  });
});
