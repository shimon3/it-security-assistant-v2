export interface PasswordResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  entropy: number;
  timeToCrack: string;
  feedback: string[];
  color: string;
  barColor: string;
}

const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'letmein',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'master',
  'welcome', 'shadow', 'superman', 'michael', 'football', 'password1', 'admin',
  'login', 'test', 'hello', 'charlie', 'donald', 'password123', 'qwerty123',
]);

function getCharsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 32;
  return size || 1;
}

function calcEntropy(password: string): number {
  const charsetSize = getCharsetSize(password);
  return Math.log2(Math.pow(charsetSize, password.length));
}

function formatTimeToCrack(entropy: number): string {
  // Assume 10 billion guesses/sec (offline GPU attack)
  const guessesPerSecond = 1e10;
  const combinations = Math.pow(2, entropy);
  const seconds = combinations / guessesPerSecond / 2; // average 50% of keyspace

  if (seconds < 1) return 'Instantly';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
  return 'Centuries';
}

export function checkPasswordStrength(password: string): PasswordResult {
  if (!password) {
    return { score: 0, label: 'Very Weak', entropy: 0, timeToCrack: 'Instantly', feedback: [], color: 'text-red-400', barColor: 'bg-red-500' };
  }

  const feedback: string[] = [];
  let points = 0;

  // Common password check
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    feedback.push('This is one of the most common passwords — never use it');
    return { score: 0, label: 'Very Weak', entropy: calcEntropy(password), timeToCrack: 'Instantly', feedback, color: 'text-red-400', barColor: 'bg-red-500' };
  }

  // Length scoring
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (password.length >= 16) points++;
  if (password.length < 8) feedback.push('Use at least 8 characters');
  else if (password.length < 12) feedback.push('Longer passwords are stronger — aim for 12+');

  // Character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) points += 0.5;
  if (hasUpper) points += 0.5;
  if (hasDigit) points += 0.5;
  if (hasSpecial) points += 1;

  if (!hasUpper) feedback.push('Add uppercase letters (A–Z)');
  if (!hasDigit) feedback.push('Add numbers (0–9)');
  if (!hasSpecial) feedback.push('Add special characters (!@#$%...)');

  // Repeated characters
  if (/(.)\1{2,}/.test(password)) {
    points -= 0.5;
    feedback.push('Avoid repeated characters (e.g. "aaa")');
  }

  // Sequential patterns
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    points -= 0.5;
    feedback.push('Avoid sequential patterns (e.g. "abc", "123")');
  }

  // Keyboard patterns
  if (/(?:qwerty|azerty|qwertz|asdf|zxcv)/i.test(password)) {
    points -= 0.5;
    feedback.push('Avoid keyboard patterns (e.g. "qwerty")');
  }

  const entropy = calcEntropy(password);
  const timeToCrack = formatTimeToCrack(entropy);

  // Clamp score 0-4
  const rawScore = Math.max(0, Math.min(4, Math.round(points)));
  const score = rawScore as 0 | 1 | 2 | 3 | 4;

  const labels: PasswordResult['label'][] = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400', 'text-sky-400'];
  const barColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500'];

  return {
    score,
    label: labels[score],
    entropy: Math.round(entropy),
    timeToCrack,
    feedback,
    color: colors[score],
    barColor: barColors[score],
  };
}
