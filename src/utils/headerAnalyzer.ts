export interface HeaderDetection {
  header: string;
  value: string;
  reason: string;
  severity: number;
}

export interface HeaderAnalysisResult {
  score: number;
  detections: HeaderDetection[];
}

function extractHeader(headers: string, name: string): string | null {
  const regex = new RegExp(`^${name}:\\s*(.+)`, 'im');
  const match = headers.match(regex);
  return match ? match[1].trim() : null;
}

function extractAllHeaders(headers: string, name: string): string[] {
  const regex = new RegExp(`^${name}:\\s*(.+)`, 'gim');
  return [...headers.matchAll(regex)].map((m) => m[1].trim());
}

function extractEmail(str: string): string | null {
  return str.match(/[\w.+\-]+@[\w.\-]+/)?.[0]?.toLowerCase() ?? null;
}

function extractDomain(email: string): string {
  return email.split('@')[1] ?? '';
}

export function analyzeHeaders(raw: string): HeaderAnalysisResult {
  const detections: HeaderDetection[] = [];
  let score = 0;

  const add = (d: HeaderDetection) => {
    detections.push(d);
    score += d.severity;
  };

  // SPF
  const spf = extractHeader(raw, 'Received-SPF');
  if (spf) {
    if (/\bfail\b/i.test(spf) && !/softfail/i.test(spf)) {
      add({ header: 'Received-SPF', value: spf, reason: 'SPF failed — this domain did not authorize the sending server', severity: 30 });
    } else if (/softfail/i.test(spf)) {
      add({ header: 'Received-SPF', value: spf, reason: 'SPF softfail — sender may not be authorized by this domain', severity: 15 });
    }
  }

  // DKIM / DMARC via Authentication-Results
  const authResults = extractAllHeaders(raw, 'Authentication-Results');
  let dkimFlagged = false;
  let dmarcFlagged = false;
  authResults.forEach((auth) => {
    if (/dkim=fail/i.test(auth) && !dkimFlagged) {
      add({ header: 'Authentication-Results', value: auth, reason: 'DKIM signature failed — email content may have been modified in transit', severity: 30 });
      dkimFlagged = true;
    }
    if (/dmarc=fail/i.test(auth) && !dmarcFlagged) {
      add({ header: 'Authentication-Results', value: auth, reason: 'DMARC policy failed — domain alignment check did not pass', severity: 25 });
      dmarcFlagged = true;
    }
  });

  // From vs Reply-To domain mismatch
  const from = extractHeader(raw, 'From');
  const replyTo = extractHeader(raw, 'Reply-To');
  if (from && replyTo) {
    const fromEmail = extractEmail(from);
    const replyEmail = extractEmail(replyTo);
    if (fromEmail && replyEmail) {
      const fromDomain = extractDomain(fromEmail);
      const replyDomain = extractDomain(replyEmail);
      if (fromDomain && replyDomain && fromDomain !== replyDomain) {
        add({ header: 'Reply-To', value: replyTo, reason: `Reply goes to ${replyDomain} but email claims to be from ${fromDomain} — classic phishing trick`, severity: 30 });
      }
    }
  }

  // Return-Path vs From domain mismatch
  const returnPath = extractHeader(raw, 'Return-Path');
  if (from && returnPath) {
    const fromEmail = extractEmail(from);
    const returnEmail = extractEmail(returnPath);
    if (fromEmail && returnEmail) {
      const fromDomain = extractDomain(fromEmail);
      const returnDomain = extractDomain(returnEmail);
      if (fromDomain && returnDomain && fromDomain !== returnDomain) {
        add({ header: 'Return-Path', value: returnPath, reason: `Return-Path domain (${returnDomain}) does not match sender domain (${fromDomain})`, severity: 20 });
      }
    }
  }

  // Message-ID domain vs From domain mismatch
  const messageId = extractHeader(raw, 'Message-ID');
  if (messageId && from) {
    const fromEmail = extractEmail(from);
    const fromDomain = fromEmail ? extractDomain(fromEmail) : null;
    const msgIdDomain = messageId.match(/@([\w.\-]+)/)?.[1]?.toLowerCase();
    if (fromDomain && msgIdDomain && !msgIdDomain.endsWith(fromDomain) && !fromDomain.endsWith(msgIdDomain)) {
      add({ header: 'Message-ID', value: messageId, reason: `Message-ID domain (${msgIdDomain}) does not match sender domain (${fromDomain})`, severity: 15 });
    }
  }

  // Excessive Received hops
  const received = extractAllHeaders(raw, 'Received');
  if (received.length > 5) {
    add({ header: 'Received', value: `${received.length} hops`, reason: `Unusually long routing chain (${received.length} hops) — may indicate obfuscation or spoofing`, severity: 10 });
  }

  // Suspicious X-Mailer
  const xMailer = extractHeader(raw, 'X-Mailer');
  if (xMailer) {
    const lower = xMailer.toLowerCase();
    if (['massmail', 'atomic', 'sendblaster', 'gammadyne', 'group mail'].some((m) => lower.includes(m))) {
      add({ header: 'X-Mailer', value: xMailer, reason: 'Known mass-mailing software detected — commonly used for spam campaigns', severity: 20 });
    }
  }

  // X-Spam-Status flagged
  const spamStatus = extractHeader(raw, 'X-Spam-Status');
  if (spamStatus && /^yes/i.test(spamStatus)) {
    add({ header: 'X-Spam-Status', value: spamStatus, reason: 'Email was flagged as spam by the receiving mail server', severity: 20 });
  }

  // X-Originating-IP present (informational)
  const originIp = extractHeader(raw, 'X-Originating-IP');
  if (originIp) {
    const privateIp = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)/.test(originIp.trim());
    if (!privateIp) {
      add({ header: 'X-Originating-IP', value: originIp, reason: `Email originated from external IP ${originIp.trim()} — consider verifying this IP's reputation`, severity: 5 });
    }
  }

  return { score: Math.min(score, 100), detections };
}
