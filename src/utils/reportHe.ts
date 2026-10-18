// Hebrew wording for the client report. Keyed by finding id (src/utils/domainScore.ts,
// src/utils/httpHeadersScore.ts). Written for a business owner, not a technician:
// the title says what is wrong, the impact says why it matters, the fix says what to ask for.
// Technical terms (SPF, DMARC, HTTPS…) stay in Latin letters, as Israeli IT providers use them.

import type { Finding, Severity } from './findings';

export type Effort = 'easy' | 'medium' | 'hard';

export interface HeText {
  title: string;
  impact: string;
  fix: string;
  effort: Effort;
  /** Who usually makes the change. */
  owner: 'email' | 'web' | 'dns' | 'it';
}

export const SEVERITY_HE: Record<Severity, string> = {
  critical: 'קריטי',
  high: 'גבוה',
  medium: 'בינוני',
  low: 'נמוך',
  ok: 'תקין',
};

export const EFFORT_HE: Record<Effort, string> = {
  easy: 'קל — עד שעה',
  medium: 'בינוני — חצי יום',
  hard: 'מורכב — דורש תכנון',
};

export const OWNER_HE: Record<HeText['owner'], string> = {
  email: 'מנהל הדואר (Google / Microsoft 365)',
  web: 'ספק האחסון או בונה האתר',
  dns: 'מי שמנהל את ה-DNS של הדומיין',
  it: 'אחראי ה-IT / ספק המחשוב',
};

type Params = Record<string, string | number>;
const T: Record<string, (p: Params) => HeText> = {
  // ── Email: SPF ──
  'spf-missing': () => ({
    title: 'אין רשומת SPF',
    impact: 'שרתי דואר לא יכולים לבדוק אילו שרתים רשאים לשלוח מיילים בשם העסק, ולכן קל יותר להעביר מיילים מזויפים.',
    fix: 'לפרסם רשומת TXT אחת שמתחילה ב-"v=spf1", מפרטת את ספקי הדואר ומסתיימת ב-"-all" או "~all".',
    effort: 'easy', owner: 'dns',
  }),
  'spf-multiple': (p) => ({
    title: `${p.count} רשומות SPF במקום אחת`,
    impact: 'כשיש יותר מרשומת SPF אחת, שרתי הדואר מתייחסים ל-SPF כאילו הוא לא קיים.',
    fix: 'לאחד את כל הרשומות לרשומת "v=spf1" אחת.',
    effort: 'easy', owner: 'dns',
  }),
  'spf-pass-all': () => ({
    title: 'ה-SPF מאשר לכל שרת בעולם לשלוח בשם העסק ("+all")',
    impact: 'כל אחד יכול לשלוח מייל בשם העסק שיעבור את בדיקת ה-SPF.',
    fix: 'להחליף את "+all" ב-"-all" (או "~all" בזמן שבודקים שכל השולחים הלגיטימיים ברשימה).',
    effort: 'easy', owner: 'dns',
  }),
  'spf-neutral': (p) => ({
    title: p.variant === 'none' ? 'ברשומת ה-SPF חסר כלל "all"' : 'ה-SPF מסתיים ב-"?all" (ניטרלי)',
    impact: 'שרתים שלא מופיעים ברשימה לא מסומנים כחשודים, כך שה-SPF כמעט לא מגן.',
    fix: 'לסיים את הרשומה ב-"-all" או "~all".',
    effort: 'easy', owner: 'dns',
  }),
  'spf-softfail': () => ({
    title: 'ה-SPF מסתיים ב-"~all" (כישלון רך)',
    impact: 'מקובל כאשר DMARC אוכף. לבדו, מיילים מזויפים עלולים להגיע לתיקיית הספאם במקום להיחסם.',
    fix: 'לעבור ל-"-all" אחרי שכל השולחים הלגיטימיים ברשימה, או להסתמך על מדיניות DMARC אוכפת.',
    effort: 'easy', owner: 'dns',
  }),
  'spf-too-many-lookups': (p) => ({
    title: `ה-SPF דורש ${p.count} בדיקות DNS (המגבלה היא 10)`,
    impact: 'מעל 10 בדיקות, שרתי הדואר מתייחסים ל-SPF ככושל, ואפילו מיילים אמיתיים של העסק עלולים להידחות או להגיע לספאם.',
    fix: 'להסיר רשומות "include:" שאינן בשימוש, או להחליף חלק מהן בטווחי ה-IP של הספקים.',
    effort: 'medium', owner: 'dns',
  }),
  'spf-ok': () => ({ title: 'ה-SPF מוגדר בצורה מחמירה ("-all")', impact: 'רק השרתים שברשימה רשאים לשלוח בשם הדומיין.', fix: '—', effort: 'easy', owner: 'dns' }),

  // ── Email: DMARC ──
  'dmarc-missing': () => ({
    title: 'אין רשומת DMARC',
    impact: 'כל אחד יכול לשלוח מיילים שנראים כאילו נשלחו מהעסק, ללקוחות, לספקים או לעובדים, ושרתי הדואר לא מקבלים הוראה לחסום אותם.',
    fix: 'לפרסם רשומת TXT בשם "_dmarc": להתחיל ב-"v=DMARC1; p=none; rua=mailto:…" כדי לאסוף דוחות, ואחר כך לעבור ל-"p=quarantine" ול-"p=reject".',
    effort: 'easy', owner: 'dns',
  }),
  'dmarc-multiple': (p) => ({
    title: `${p.count} רשומות DMARC במקום אחת`,
    impact: 'כשיש יותר מרשומה אחת, שרתי הדואר מתעלמים מ-DMARC לגמרי.',
    fix: 'להשאיר רשומת "_dmarc" אחת בלבד.',
    effort: 'easy', owner: 'dns',
  }),
  'dmarc-reject': () => ({ title: 'DMARC חוסם מיילים מזויפים (p=reject)', impact: 'שרתי הדואר דוחים מיילים שנכשלים באימות.', fix: '—', effort: 'easy', owner: 'dns' }),
  'dmarc-quarantine': () => ({
    title: 'DMARC מעביר מיילים מזויפים לספאם (p=quarantine)',
    impact: 'מיילים מזויפים בדרך כלל מגיעים לתיקיית הספאם במקום להיחסם.',
    fix: 'לעבור ל-"p=reject" כשהדוחות מראים שרק שולחים לגיטימיים עוברים.',
    effort: 'easy', owner: 'dns',
  }),
  'dmarc-none': (p) => ({
    title: p.variant === 'invalid' ? 'מדיניות ה-DMARC חסרה או שגויה' : 'DMARC רק מנטר (p=none)',
    impact: 'מיילים מזויפים בשם העסק עדיין מגיעים כרגיל; הרשומה רק מפיקה דוחות.',
    fix: 'לעבור על הדוחות, ואז לעבור ל-"p=quarantine" ולאחר מכן ל-"p=reject".',
    effort: 'medium', owner: 'dns',
  }),
  'dmarc-pct': (p) => ({
    title: `DMARC חל רק על ${p.pct}% מהמיילים`,
    impact: 'שאר המיילים שנכשלים באימות מגיעים כרגיל.',
    fix: 'להעלות את "pct" ל-100 (או להסיר אותו).',
    effort: 'easy', owner: 'dns',
  }),
  'dmarc-no-reports': () => ({
    title: 'דוחות DMARC לא נאספים (אין "rua")',
    impact: 'אף אחד לא רואה מי שולח מיילים בשם העסק, לגיטימי או לא.',
    fix: 'להוסיף "rua=mailto:…" עם תיבת דואר או שירות חינמי לניתוח דוחות DMARC.',
    effort: 'easy', owner: 'dns',
  }),

  // ── Email: DKIM, MX, DNSSEC, MTA-STS ──
  'dkim-found': (p) => ({ title: `נמצא מפתח DKIM (selector: ${p.selectors})`, impact: 'אפשר לחתום על המיילים כך שהנמען יוכל לוודא שלא שונו.', fix: '—', effort: 'easy', owner: 'email' }),
  'dkim-not-found': () => ({
    title: 'לא נמצא מפתח DKIM',
    impact: 'ייתכן שהמיילים לא נחתמים, וזה מחליש את ה-DMARC. ייתכן שהספק משתמש ב-selector שלא נבדק כאן: יש לוודא במסוף הניהול.',
    fix: 'להפעיל חתימת DKIM ב-Google Workspace, ב-Microsoft 365 או בפאנל האחסון, ולפרסם את המפתח שמתקבל.',
    effort: 'easy', owner: 'email',
  }),
  'mx-missing': () => ({
    title: 'הדומיין לא מקבל דואר (אין רשומת MX)',
    impact: 'אם הדומיין גם לא שולח דואר, צריך לציין זאת ב-DNS, אחרת קל לזייף מיילים בשמו.',
    fix: 'לדומיין שלא שולח דואר: SPF ‏"v=spf1 -all" ו-DMARC ‏"p=reject".',
    effort: 'easy', owner: 'dns',
  }),
  'dnssec-on': () => ({ title: 'DNSSEC מופעל', impact: 'תשובות ה-DNS של הדומיין חתומות.', fix: '—', effort: 'easy', owner: 'dns' }),
  'dnssec-off': () => ({
    title: 'DNSSEC לא מופעל',
    impact: 'תשובות ה-DNS לא חתומות ולכן ניתן לזייף אותן בדרך. נדיר בפועל, אבל זול לתקן.',
    fix: 'להפעיל DNSSEC אצל ספק ה-DNS ואצל רשם הדומיין.',
    effort: 'medium', owner: 'dns',
  }),
  'mta-sts-missing': () => ({
    title: 'MTA-STS לא מוגדר',
    impact: 'תוקף ברשת יכול לגרום לדואר נכנס לעבור בחיבור לא מוצפן.',
    fix: 'לפרסם מדיניות MTA-STS (נתמך ב-Google Workspace וב-Microsoft 365).',
    effort: 'medium', owner: 'email',
  }),
  'tls-rpt-missing': () => ({
    title: 'דיווח TLS לא מוגדר',
    impact: 'כשלים במסירה מאובטחת של דואר לעסק עוברים בלי שאיש יידע.',
    fix: 'לפרסם רשומת TXT בשם "_smtp._tls" עם "v=TLSRPTv1; rua=mailto:…".',
    effort: 'easy', owner: 'dns',
  }),

  // ── Website ──
  'https-unreachable': () => ({
    title: 'האתר זמין ב-HTTP אך לא ב-HTTPS',
    impact: 'קיים שירות אינטרנט ציבורי ללא נקודת HTTPS תקינה, ולכן התעבורה עלולה להישאר לא מוצפנת.',
    fix: 'להפעיל HTTPS עם תעודת TLS תקינה ולהפנות את תעבורת ה-HTTP ל-HTTPS.',
    effort: 'medium', owner: 'web',
  }),
  'no-https-redirect': () => ({
    title: 'הכתובת ב-HTTP לא מפנה ל-HTTPS',
    impact: 'מי שמקליד את הכתובת בלי "https" נשאר בעמוד לא מוצפן.',
    fix: 'להוסיף הפניה קבועה (301) מ-"http://" ל-"https://" בהגדרות האחסון.',
    effort: 'easy', owner: 'web',
  }),
  'hsts-missing': () => ({
    title: 'אין כותרת HSTS',
    impact: 'הדפדפן עלול לנסות קודם את הגרסה הלא מוצפנת, וזה מאפשר לתוקף ברשת Wi-Fi ציבורית ליירט את הגלישה.',
    fix: 'לשלוח "Strict-Transport-Security: max-age=31536000; includeSubDomains".',
    effort: 'easy', owner: 'web',
  }),
  'hsts-short': (p) => ({
    title: `ה-HSTS תקף רק ${p.days} ימים`,
    impact: 'ההגנה פגה מהר והדפדפנים שוכחים אותה בין ביקורים.',
    fix: 'להעלות את max-age ל-15552000 לפחות (6 חודשים), ועדיף 31536000 (שנה).',
    effort: 'easy', owner: 'web',
  }),
  'hsts-ok': () => ({ title: 'HSTS מוגדר', impact: 'הדפדפנים תמיד משתמשים ב-HTTPS באתר.', fix: '—', effort: 'easy', owner: 'web' }),
  'csp-missing': () => ({
    title: 'אין מדיניות אבטחת תוכן (CSP)',
    impact: 'אם תוקף מצליח להחדיר סקריפט לעמוד (למשל דרך חולשה בתוסף), הדפדפן יריץ אותו.',
    fix: 'להוסיף כותרת Content-Security-Policy שמגדירה מאיפה מותר לטעון סקריפטים. להתחיל במצב report-only.',
    effort: 'hard', owner: 'web',
  }),
  'csp-report-only': () => ({
    title: 'מדיניות ה-CSP במצב בדיקה בלבד',
    impact: 'המדיניות מדווחת על הפרות אבל לא חוסמת סקריפטים מוחדרים.',
    fix: 'כשהדוחות לא מראים חסימות לגיטימיות, להחליף את "Content-Security-Policy-Report-Only" ב-"Content-Security-Policy".',
    effort: 'medium', owner: 'web',
  }),
  'csp-unsafe-inline': () => ({
    title: 'מדיניות ה-CSP מתירה סקריפטים מוטמעים',
    impact: 'המדיניות קיימת אבל לא תעצור את רוב הסקריפטים המוחדרים.',
    fix: 'להסיר את \'unsafe-inline\' מ-script-src ולהשתמש ב-nonce או ב-hash לסקריפטים שהאתר צריך.',
    effort: 'hard', owner: 'web',
  }),
  'csp-ok': () => ({ title: 'מדיניות CSP מוגדרת', impact: 'הדפדפן מגביל מאיפה מותר לטעון סקריפטים.', fix: '—', effort: 'easy', owner: 'web' }),
  clickjacking: () => ({
    title: 'אתרים אחרים יכולים להטמיע את האתר במסגרת',
    impact: 'עמוד מזויף יכול להציג את האתר האמיתי בתוך מסגרת שקופה ולגרום לגולשים ללחוץ על כפתורים בלי לדעת (clickjacking).',
    fix: 'לשלוח "X-Frame-Options: SAMEORIGIN" או להוסיף "frame-ancestors \'self\'" ל-CSP.',
    effort: 'easy', owner: 'web',
  }),
  'nosniff-missing': () => ({
    title: 'חסרה הכותרת "X-Content-Type-Options: nosniff"',
    impact: 'הדפדפן עלול לנחש את סוג הקובץ, וכך קובץ שהועלה לאתר יכול לרוץ כסקריפט.',
    fix: 'לשלוח "X-Content-Type-Options: nosniff".',
    effort: 'easy', owner: 'web',
  }),
  'referrer-missing': () => ({
    title: 'אין Referrer-Policy',
    impact: 'כתובות העמודים המלאות, לפעמים עם פרטים אישיים, נשלחות לכל אתר חיצוני שהגולש עובר אליו.',
    fix: 'לשלוח "Referrer-Policy: strict-origin-when-cross-origin".',
    effort: 'easy', owner: 'web',
  }),
  'permissions-missing': () => ({
    title: 'אין Permissions-Policy',
    impact: 'תוכן מוטמע של צד שלישי יכול לבקש גישה למצלמה, למיקרופון או למיקום.',
    fix: 'לשלוח Permissions-Policy שמבטלת יכולות שהאתר לא משתמש בהן, למשל "camera=(), microphone=(), geolocation=()".',
    effort: 'easy', owner: 'web',
  }),
  'version-disclosed': () => ({
    title: 'השרת חושף את גרסאות התוכנה שלו',
    impact: 'תוקפים יכולים לחפש חולשות ידועות לגרסה המדויקת בלי שום מאמץ.',
    fix: 'להסתיר את מספרי הגרסה בכותרות "Server" ו-"X-Powered-By" (בהגדרות השרת או האחסון).',
    effort: 'easy', owner: 'web',
  }),
};

export function hasHebrew(id: string): boolean {
  return id in T;
}

/** Hebrew text for a finding; falls back to the English text if no translation exists. */
export function heText(f: Finding): HeText {
  const make = T[f.id];
  if (make) return make(f.params ?? {});

  if (f.id.startsWith('internal-')) {
    const p = f.params ?? {};
    const effort = p.effort === 'easy' || p.effort === 'hard' ? p.effort : 'medium';
    return {
      title: typeof p.heTitle === 'string' ? p.heTitle : f.title,
      impact: typeof p.heImpact === 'string' ? p.heImpact : f.impact,
      fix: typeof p.heFix === 'string' ? p.heFix : f.recommendation,
      effort,
      owner: 'it',
    };
  }

  return { title: f.title, impact: f.impact, fix: f.recommendation, effort: 'medium', owner: 'web' };
}
