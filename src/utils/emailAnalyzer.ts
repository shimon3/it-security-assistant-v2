export interface URLDetection {
  url: string;
  reason: string;
  severity: number;
}

export interface AttachmentDetection {
  name: string;
  reason: string;
  severity: number;
}

export interface AnalysisResult {
  score: number;
  level: 'Low' | 'Medium' | 'High';
  issues: string[];
  suspiciousUrls: URLDetection[];
  suspiciousAttachments: AttachmentDetection[];
  explanation: string;
  recommendations: string[];
}

const SUSPICIOUS_WORDS = [
  'urgent',
  'verify',
  'login',
  'password',
  'reset',
  'confirm',
  'suspended',
  'limited',
  'immediately',
  'expires',
  'click here',
  'update now',
  'validate',
];

const FAKE_DOMAINS = [
  'micr0soft',
  'gooogle',
  'paypaI',
  'paypa1',
  'g00gle',
  'arnazon',
  'amaz0n',
  'netfl1x',
  'app1e',
  'faceb00k',
  'linkedln',
  'instaqram',
  'tw1tter',
];

const PHISHING_PHRASES = [
  'account suspended',
  'act now',
  'verify your account',
  'unusual activity',
  'security alert',
  'your account will be closed',
  'confirm your identity',
  'winner',
  'you have been selected',
  'limited time',
  'congratulations',
  'claim your prize',
];

const SUSPICIOUS_PATTERNS = [
  {
    pattern: /dear (customer|user|member|sir|madam)/i,
    label: 'Generic salutation',
  },
  {
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
    label: 'Raw IP address in content',
  },
  {
    pattern: /[^\s@]+@[^\s@]*\.(xyz|top|click|loan|work|bid|win)/i,
    label: 'Suspicious TLD in email',
  },
];

const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'short.io',
  'tiny.cc',
  'rb.gy',
];

const SUSPICIOUS_TLDS = [
  '.xyz',
  '.top',
  '.click',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.pw',
  '.cc',
];

const BRAND_NAMES = [
  'paypal',
  'microsoft',
  'amazon',
  'apple',
  'google',
  'netflix',
  'facebook',
  'twitter',
  'linkedin',
  'instagram',
];

const SUSPICIOUS_ATTACHMENTS = [
  {
    ext: '.exe',
    reason: 'Executable file — can install malware',
    severity: 40,
  },
  {
    ext: '.bat',
    reason: 'Batch script — can run malicious commands',
    severity: 35,
  },
  {
    ext: '.cmd',
    reason: 'Command script — can run malicious commands',
    severity: 35,
  },
  {
    ext: '.vbs',
    reason: 'Visual Basic script — often used in malware',
    severity: 35,
  },
  {
    ext: '.ps1',
    reason: 'PowerShell script — can control your system',
    severity: 35,
  },
  {
    ext: '.zip',
    reason: 'Archive file — may contain hidden malware',
    severity: 20,
  },
  {
    ext: '.rar',
    reason: 'Archive file — may contain hidden malware',
    severity: 20,
  },
  {
    ext: '.docx',
    reason: 'Word document — may contain malicious macros',
    severity: 15,
  },
  {
    ext: '.doc',
    reason: 'Word document — may contain malicious macros',
    severity: 15,
  },
  { ext: '.xlsm', reason: 'Excel file with macros — high risk', severity: 25 },
  {
    ext: '.iso',
    reason: 'Disk image — can bypass email filters',
    severity: 30,
  },
];

const HEBREW_PHISHING_PHRASES = [
  {
    phrase: 'הסדיר את הסכום',
    reason: 'Urgent payment request in Hebrew',
    severity: 25,
  },
  {
    phrase: 'אישור התשלום',
    reason: 'Payment confirmation request in Hebrew',
    severity: 20,
  },
  {
    phrase: 'העברה בנקאית',
    reason: 'Bank transfer request in Hebrew',
    severity: 25,
  },
  { phrase: 'עוד היום', reason: 'Same-day urgency in Hebrew', severity: 20 },
  { phrase: 'בהקדם האפשרי', reason: 'Urgency phrase in Hebrew', severity: 15 },
  { phrase: 'מיד', reason: 'Immediate action request in Hebrew', severity: 15 },
  {
    phrase: 'אמת את הזהות',
    reason: 'Identity verification request in Hebrew',
    severity: 25,
  },
  {
    phrase: 'אמת את חשבונך',
    reason: 'Account verification request in Hebrew',
    severity: 25,
  },
  {
    phrase: 'החשבון שלך הושעה',
    reason: 'Account suspended notice in Hebrew',
    severity: 30,
  },
  {
    phrase: 'פעילות חשודה',
    reason: 'Suspicious activity alert in Hebrew',
    severity: 25,
  },
  { phrase: 'לחץ כאן', reason: 'Click here phrase in Hebrew', severity: 15 },
  {
    phrase: 'עדכן את הסיסמה',
    reason: 'Password update request in Hebrew',
    severity: 25,
  },
  { phrase: 'זכית', reason: 'You won — lottery scam in Hebrew', severity: 30 },
  { phrase: 'קבל את הפרס', reason: 'Claim your prize in Hebrew', severity: 30 },
  { phrase: 'הצעה מוגבלת', reason: 'Limited offer in Hebrew', severity: 15 },
  {
    phrase: 'חשבונית',
    reason: 'Invoice mentioned in Hebrew context',
    severity: 10,
  },
];

const SUSPICIOUS_FOREIGN_DOMAINS = [
  {
    pattern: /\.com\.br$/i,
    reason: 'Brazilian domain sending to Israeli recipient',
    severity: 15,
  },
  { pattern: /\.ru$/i, reason: 'Russian domain — high risk', severity: 25 },
  { pattern: /\.cn$/i, reason: 'Chinese domain — verify sender', severity: 20 },
  {
    pattern: /\.ng$/i,
    reason: 'Nigerian domain — high fraud risk',
    severity: 30,
  },
  {
    pattern: /\.ro$/i,
    reason: 'Romanian domain — commonly used in fraud',
    severity: 20,
  },
];

const SUSPICIOUS_PHONE_PATTERNS = [
  {
    pattern: /\+9[0-9]{2}[\s\-]?[0-9]{6,}/,
    reason: 'Premium rate international number (+9xx)',
    severity: 25,
  },
  {
    pattern: /\+7[\s\-]?[0-9]{10}/,
    reason: 'Russian phone number',
    severity: 20,
  },
  {
    pattern: /\+234[\s\-]?[0-9]{7,}/,
    reason: 'Nigerian phone number — high fraud risk',
    severity: 30,
  },
  {
    pattern: /\+233[\s\-]?[0-9]{7,}/,
    reason: 'Ghanaian phone number — commonly used in fraud',
    severity: 25,
  },
  {
    pattern: /\+225[\s\-]?[0-9]{7,}/,
    reason: 'Ivory Coast number — commonly used in fraud',
    severity: 25,
  },
  {
    pattern: /\+44\s?7[0-9]{9}/,
    reason: 'UK mobile — often used in WhatsApp scams',
    severity: 15,
  },
  {
    pattern: /whatsapp/i,
    reason: 'Request to contact via WhatsApp — common in fraud',
    severity: 20,
  },
  {
    pattern: /telegram/i,
    reason: 'Request to contact via Telegram — common in fraud',
    severity: 15,
  },
  {
    pattern: /signal/i,
    reason: 'Request to contact via Signal — suspicious in business context',
    severity: 10,
  },
];

const ISRAELI_SUSPICIOUS_PHONE = [
  {
    pattern: /1[\s\-]?900[\s\-]?[0-9]{6}/,
    reason: 'Israeli premium rate number (1-900)',
    severity: 30,
  },
  {
    pattern: /1[\s\-]?800[\s\-]?[0-9]{6}/,
    reason: 'Israeli toll-free number — verify legitimacy',
    severity: 10,
  },
  {
    pattern: /\*[0-9]{4}/,
    reason: 'Israeli short number (*XXXX) — verify legitimacy',
    severity: 5,
  },
];

// 🏦 Israeli banks fake domain patterns
const ISRAELI_BANK_DOMAINS = [
  { pattern: /leumi/i, officialDomain: 'leumi.co.il', bankName: 'Bank Leumi' },
  {
    pattern: /hapoalim/i,
    officialDomain: 'bankhapoalim.co.il',
    bankName: 'Bank Hapoalim',
  },
  {
    pattern: /discount/i,
    officialDomain: 'discountbank.co.il',
    bankName: 'Discount Bank',
  },
  {
    pattern: /mizrahi/i,
    officialDomain: 'mizrahi-tefahot.co.il',
    bankName: 'Mizrahi Tefahot',
  },
  {
    pattern: /poalim/i,
    officialDomain: 'bankhapoalim.co.il',
    bankName: 'Bank Hapoalim',
  },
  {
    pattern: /benleumi/i,
    officialDomain: 'beinleumi.co.il',
    bankName: 'Bank Beinleumi',
  },
  {
    pattern: /otsar/i,
    officialDomain: 'bankotsar.co.il',
    bankName: 'Otsar Hahayal',
  },
  {
    pattern: /yahav/i,
    officialDomain: 'bank-yahav.co.il',
    bankName: 'Bank Yahav',
  },
];

// 🏦 Hebrew banking phishing phrases
const HEBREW_BANK_PHRASES = [
  {
    phrase: 'אמת את פרטי הבנק',
    reason: 'Bank details verification request in Hebrew',
    severity: 35,
  },
  {
    phrase: 'כרטיס חסום',
    reason: 'Card blocked notice in Hebrew — common bank scam',
    severity: 30,
  },
  {
    phrase: 'חשבון בנק מושעה',
    reason: 'Bank account suspended in Hebrew',
    severity: 35,
  },
  {
    phrase: 'עדכן פרטי בנק',
    reason: 'Bank details update request in Hebrew',
    severity: 35,
  },
  {
    phrase: 'אמת כרטיס אשראי',
    reason: 'Credit card verification in Hebrew',
    severity: 35,
  },
  {
    phrase: 'פרטי כרטיס',
    reason: 'Card details request in Hebrew',
    severity: 25,
  },
  {
    phrase: 'מספר חשבון',
    reason: 'Account number request in Hebrew',
    severity: 20,
  },
  {
    phrase: 'קוד סודי',
    reason: 'PIN code request in Hebrew — never share this',
    severity: 40,
  },
  {
    phrase: 'cvv',
    reason: 'CVV code request — never share this',
    severity: 40,
  },
  {
    phrase: 'פג תוקף',
    reason: 'Card expiry mentioned in Hebrew',
    severity: 20,
  },
  {
    phrase: 'חידוש כרטיס',
    reason: 'Card renewal request in Hebrew',
    severity: 25,
  },
];

function extractUrls(content: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"\)]+/gi;
  const matches = content.match(urlRegex) || [];
  return [...new Set(matches.map((url) => url.replace(/[.,;!?\)]*$/, '')))];
}

function detectSuspiciousUrls(urls: string[]): URLDetection[] {
  const detected: URLDetection[] = [];

  urls.forEach((url) => {
    const urlLower = url.toLowerCase();
    const urlDomain = url.split('://')[1]?.split('/')[0] || '';
    const urlDomainLower = urlDomain.toLowerCase();

    if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlLower)) {
      detected.push({
        url,
        reason: 'IP-based URL (hides true destination)',
        severity: 25,
      });
      return;
    }

    const shortenerMatch = URL_SHORTENERS.find(
      (shortener) =>
        urlDomainLower === shortener || urlDomainLower.endsWith('.' + shortener)
    );
    if (shortenerMatch) {
      detected.push({
        url,
        reason: `URL shortener detected: ${shortenerMatch} (hides real destination)`,
        severity: 20,
      });
      return;
    }

    const hasSuspiciousTld = SUSPICIOUS_TLDS.some((tld) =>
      urlDomainLower.endsWith(tld)
    );
    if (hasSuspiciousTld) {
      detected.push({
        url,
        reason: 'Suspicious TLD (.xyz, .tk, .click, etc.)',
        severity: 15,
      });
      return;
    }

    const hasLeadingBrand = BRAND_NAMES.some(
      (brand) =>
        urlDomainLower.startsWith(brand + '.') &&
        !urlDomainLower.endsWith(brand + '.com') &&
        !urlDomainLower.endsWith(brand + '.org') &&
        !urlDomainLower.endsWith(brand + '.net')
    );
    if (hasLeadingBrand) {
      detected.push({
        url,
        reason: 'Legitimate brand used as subdomain of fake domain',
        severity: 20,
      });
      return;
    }

    const hyphens = (urlDomain.match(/-/g) || []).length;
    if (hyphens >= 3) {
      detected.push({
        url,
        reason: `Excessive hyphens in domain (${hyphens} found)`,
        severity: 10,
      });
      return;
    }

    if (url.startsWith('http://')) {
      detected.push({
        url,
        reason: 'Unencrypted HTTP instead of HTTPS',
        severity: 10,
      });
      return;
    }

    if (url.length > 100) {
      detected.push({
        url,
        reason: 'Excessively long URL (may hide parameters)',
        severity: 10,
      });
    }
  });

  return detected;
}

function detectSuspiciousAttachments(content: string): AttachmentDetection[] {
  const detected: AttachmentDetection[] = [];
  const extPattern = SUSPICIOUS_ATTACHMENTS.map((a) => a.ext.slice(1)).join('|');
  const fileRegex = new RegExp(`\\b[\\w][\\w\\-]*(\\.(${extPattern}))\\b`, 'gi');
  const matches = content.match(fileRegex) || [];

  matches.forEach((filename) => {
    const filenameLower = filename.toLowerCase();
    const attachment = SUSPICIOUS_ATTACHMENTS.find((a) =>
      filenameLower.endsWith(a.ext)
    );
    if (attachment) {
      detected.push({
        name: filename,
        reason: attachment.reason,
        severity: attachment.severity,
      });
    }
  });

  return detected.filter(
    (item, index, self) => index === self.findIndex((t) => t.name === item.name)
  );
}

function detectHebrewPhishing(
  content: string
): { reason: string; severity: number }[] {
  const detected: { reason: string; severity: number }[] = [];
  HEBREW_PHISHING_PHRASES.forEach(({ phrase, reason, severity }) => {
    if (content.includes(phrase)) {
      detected.push({ reason, severity });
    }
  });
  return detected;
}

function detectForeignDomain(
  senderEmail: string
): { reason: string; severity: number } | null {
  const domain = senderEmail.split('@')[1] || '';
  for (const { pattern, reason, severity } of SUSPICIOUS_FOREIGN_DOMAINS) {
    if (pattern.test(domain)) {
      return { reason, severity };
    }
  }
  return null;
}

function detectSuspiciousPhones(
  content: string
): { match: string; reason: string; severity: number }[] {
  const detected: { match: string; reason: string; severity: number }[] = [];

  SUSPICIOUS_PHONE_PATTERNS.forEach(({ pattern, reason, severity }) => {
    const match = content.match(pattern);
    if (match) {
      detected.push({ match: match[0], reason, severity });
    }
  });

  ISRAELI_SUSPICIOUS_PHONE.forEach(({ pattern, reason, severity }) => {
    const match = content.match(pattern);
    if (match) {
      detected.push({ match: match[0], reason, severity });
    }
  });

  const phoneRegex = /(\+?[\d][\s\-]?){7,15}/g;
  const allPhones = content.match(phoneRegex) || [];
  const uniquePhones = [...new Set(allPhones.map((p) => p.trim()))].filter(
    (p) => p.length > 6
  );
  if (uniquePhones.length >= 3) {
    detected.push({
      match: `${uniquePhones.length} phone numbers`,
      reason: `Multiple phone numbers detected (${uniquePhones.length}) — suspicious in a single email`,
      severity: 15,
    });
  }

  return detected;
}

// 🏦 Israeli bank detection
function detectIsraeliBank(
  senderEmail: string,
  content: string
): { reason: string; severity: number }[] {
  const detected: { reason: string; severity: number }[] = [];
  const senderDomain = senderEmail.split('@')[1] || '';
  const contentLower = content.toLowerCase();

  // Check fake bank domains in sender
  ISRAELI_BANK_DOMAINS.forEach(({ pattern, officialDomain, bankName }) => {
    if (pattern.test(senderDomain) && !senderDomain.endsWith(officialDomain)) {
      detected.push({
        reason: `Fake ${bankName} domain detected — official domain is ${officialDomain}`,
        severity: 40,
      });
    }
  });

  // Check fake bank URLs in content
  const urls = extractUrls(content);
  urls.forEach((url) => {
    const urlDomain = url.split('://')[1]?.split('/')[0]?.toLowerCase() || '';
    ISRAELI_BANK_DOMAINS.forEach(({ pattern, officialDomain, bankName }) => {
      if (pattern.test(urlDomain) && !urlDomain.endsWith(officialDomain)) {
        detected.push({
          reason: `Fake ${bankName} URL detected in content — official domain is ${officialDomain}`,
          severity: 40,
        });
      }
    });
  });

  // Check Hebrew bank phishing phrases
  HEBREW_BANK_PHRASES.forEach(({ phrase, reason, severity }) => {
    if (
      content.includes(phrase) ||
      contentLower.includes(phrase.toLowerCase())
    ) {
      detected.push({ reason, severity });
    }
  });

  return detected;
}

function normalize(text: string): string {
  return text.toLowerCase();
}

export function analyzeEmail(
  senderEmail: string,
  content: string
): AnalysisResult {
  const issues: string[] = [];
  let score = 0;

  const normalizedContent = normalize(content);
  const normalizedSender = normalize(senderEmail);

  SUSPICIOUS_WORDS.forEach((word) => {
    if (normalizedContent.includes(word)) {
      issues.push(`Suspicious keyword detected: "${word}"`);
      score += 8;
    }
  });

  FAKE_DOMAINS.forEach((domain) => {
    if (
      normalizedSender.includes(domain) ||
      normalizedContent.includes(domain)
    ) {
      issues.push(`Fake domain pattern detected: "${domain}"`);
      score += 20;
    }
  });

  PHISHING_PHRASES.forEach((phrase) => {
    if (normalizedContent.includes(phrase)) {
      issues.push(`Phishing phrase detected: "${phrase}"`);
      score += 15;
    }
  });

  SUSPICIOUS_PATTERNS.forEach(({ pattern, label }) => {
    if (pattern.test(content) || pattern.test(senderEmail)) {
      issues.push(label);
      score += 12;
    }
  });

  if (senderEmail && !senderEmail.includes('@')) {
    issues.push('Invalid sender email format');
    score += 10;
  }

  if (content.length < 20 && content.trim().length > 0) {
    issues.push('Unusually short email content');
    score += 5;
  }

  const urls = extractUrls(content);
  const suspiciousUrls = detectSuspiciousUrls(urls);
  suspiciousUrls.forEach((url) => {
    score += url.severity;
  });

  if (urls.length > 3) {
    issues.push(`Multiple URLs detected (${urls.length} links)`);
    score += 10;
  }

  const suspiciousAttachments = detectSuspiciousAttachments(content);
  suspiciousAttachments.forEach((att) => {
    issues.push(
      `Suspicious attachment detected: "${att.name}" — ${att.reason}`
    );
    score += att.severity;
  });

  const hebrewThreats = detectHebrewPhishing(content);
  hebrewThreats.forEach(({ reason, severity }) => {
    issues.push(`⚠️ Hebrew threat detected: ${reason}`);
    score += severity;
  });

  const foreignDomain = detectForeignDomain(senderEmail);
  if (foreignDomain) {
    issues.push(`🌍 Suspicious sender domain: ${foreignDomain.reason}`);
    score += foreignDomain.severity;
  }

  const suspiciousPhones = detectSuspiciousPhones(content);
  suspiciousPhones.forEach(({ match, reason, severity }) => {
    issues.push(`📞 Suspicious phone detected: "${match}" — ${reason}`);
    score += severity;
  });

  // 🏦 Israeli bank detection
  const bankThreats = detectIsraeliBank(senderEmail, content);
  bankThreats.forEach(({ reason, severity }) => {
    issues.push(`🏦 Israeli bank threat: ${reason}`);
    score += severity;
  });

  score = Math.min(score, 100);

  // --- Dynamic explanation ---
  const explanationParts: string[] = [];

  if (suspiciousAttachments.length > 0) {
    const attNames = suspiciousAttachments.map((a) => `"${a.name}"`).join(', ');
    explanationParts.push(
      `This email contains ${suspiciousAttachments.length} suspicious attachment(s): ${attNames}. These files can install malware or execute malicious code on your system.`
    );
  }

  if (suspiciousUrls.length > 0) {
    const urlReasons = [...new Set(suspiciousUrls.map((u) => u.reason))];
    explanationParts.push(
      `${
        suspiciousUrls.length
      } suspicious URL(s) were detected: ${urlReasons.join('; ')}.`
    );
  }

  const detectedFakeDomains = FAKE_DOMAINS.filter(
    (d) => normalizedSender.includes(d) || normalizedContent.includes(d)
  );
  if (detectedFakeDomains.length > 0) {
    explanationParts.push(
      `The sender or content uses fake domain patterns (${detectedFakeDomains.join(
        ', '
      )}) that impersonate legitimate companies.`
    );
  }

  const detectedPhrases = PHISHING_PHRASES.filter((p) =>
    normalizedContent.includes(p)
  );
  if (detectedPhrases.length > 0) {
    explanationParts.push(
      `Phishing language was detected: "${detectedPhrases
        .slice(0, 3)
        .join(
          '", "'
        )}". These are classic social engineering tactics used to pressure victims.`
    );
  }

  const detectedWords = SUSPICIOUS_WORDS.filter((w) =>
    normalizedContent.includes(w)
  );
  if (detectedWords.length > 0) {
    explanationParts.push(
      `${detectedWords.length} suspicious keyword(s) found: "${detectedWords
        .slice(0, 4)
        .join(
          '", "'
        )}". This language is commonly used to create urgency and panic.`
    );
  }

  if (hebrewThreats.length > 0) {
    explanationParts.push(
      `${
        hebrewThreats.length
      } Hebrew phishing indicator(s) detected: ${hebrewThreats
        .slice(0, 3)
        .map((t) => t.reason)
        .join('; ')}.`
    );
  }

  if (foreignDomain) {
    explanationParts.push(
      `The sender's domain raised a geographic flag: ${foreignDomain.reason}.`
    );
  }

  if (suspiciousPhones.length > 0) {
    explanationParts.push(
      `${
        suspiciousPhones.length
      } suspicious phone indicator(s) detected: ${suspiciousPhones
        .slice(0, 2)
        .map((p) => p.reason)
        .join('; ')}.`
    );
  }

  if (bankThreats.length > 0) {
    explanationParts.push(
      `🏦 ${
        bankThreats.length
      } Israeli bank phishing indicator(s) detected: ${bankThreats
        .slice(0, 2)
        .map((b) => b.reason)
        .join('; ')}.`
    );
  }

  if (explanationParts.length === 0) {
    explanationParts.push(
      'No significant threats were detected. This email appears relatively safe.'
    );
  }

  const explanation = explanationParts.join(' ');

  // --- Level & recommendations ---
  let level: 'Low' | 'Medium' | 'High';
  let recommendations: string[];

  if (score >= 60) {
    level = 'High';
    recommendations = [
      'Do not click any links or download attachments',
      'Do not reply or provide any personal information',
      'Report this email to your IT security team immediately',
      'Mark it as phishing/spam in your email client',
      'Delete the email from your inbox and trash',
    ];
  } else if (score >= 25) {
    level = 'Medium';
    recommendations = [
      'Verify the sender identity through official channels',
      'Hover over links before clicking to inspect URLs',
      'Do not provide sensitive information via this email',
      'Contact the supposed sender directly to confirm',
      'Consider reporting if you believe it is suspicious',
    ];
  } else {
    level = 'Low';
    recommendations = [
      'Always verify unexpected requests from known senders',
      'Keep your email client and antivirus software updated',
      'Be cautious with attachments even from known senders',
      'Enable two-factor authentication on your accounts',
    ];
  }

  if (
    issues.length === 0 &&
    suspiciousUrls.length === 0 &&
    suspiciousAttachments.length === 0 &&
    suspiciousPhones.length === 0 &&
    bankThreats.length === 0
  ) {
    issues.push('No specific threats detected');
  }

  return {
    score,
    level,
    issues,
    suspiciousUrls,
    suspiciousAttachments,
    explanation,
    recommendations,
  };
}
