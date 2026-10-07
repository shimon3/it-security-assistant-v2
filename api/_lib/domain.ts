// Normalises user input ("https://www.example.co.il/path") to a bare hostname and validates it.

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

export function normalizeDomain(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .split(/[/?#]/)[0]
    .split('@')
    .pop()!
    .split(':')[0]
    .replace(/\.$/, '');

  if (!host || host.length > 253) return null;
  const labels = host.split('.');
  if (labels.length < 2) return null;
  if (!labels.every((l) => LABEL.test(l))) return null;
  // Top-level domain must not be all digits (rules out IPv4 addresses).
  if (/^\d+$/.test(labels[labels.length - 1])) return null;
  return host;
}
