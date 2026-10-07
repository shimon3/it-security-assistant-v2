import { useSyncExternalStore } from 'react';

export type Language = 'en' | 'he';

const KEY = 'itsa_language';
const EVENT = 'itsa-language-change';

export const en = {
  languageEnglish: 'English',
  languageHebrew: 'עברית',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  home: 'Home',
  privacy: 'Data & privacy',
  auditMode: 'Audit mode',
  auditOn: 'on',
  auditOff: 'off',
  auditHint: 'For client work: hides non-commercial lookups, keeps no email history.',
  demoBanner: 'Demo: every result is made up for a fictional shop. Nothing is sent to the server.',
  exitDemo: 'Exit demo',

  heroTitle: 'Find where a small business is exposed, in one sitting.',
  heroBody: 'Check whether anyone can send email in the company’s name, whether staff passwords have leaked, and whether that suspicious email is phishing. Every finding comes with a fix in plain words.',
  openTools: 'Open the tools',
  tryDemo: 'Try the demo',
  demoHint: 'The demo uses a made-up shop, so you can show it to anyone without an access token.',
  sampleSpf: 'SPF lists the mail servers',
  sampleDmarc: 'DMARC only monitors (p=none)',
  sampleDkim: 'No DKIM signature found',
  sampleHsts: 'Website sends no HSTS header',
  sampleCaption: 'Example of a domain email security result.',
  footerPermission: 'For security assessments with the owner’s permission and for internal awareness.',

  groupClientAudit: 'Client audit',
  groupUtilities: 'Utilities',
  groupPersonal: 'Personal lookups',
  toolDomainAudit: 'Domain email security',
  toolHttpHeaders: 'Website security headers',
  toolEmail: 'Email analysis',
  toolHeaders: 'Email header analyzer',
  toolHibp: 'Breached passwords',
  toolPassword: 'Password strength',
  toolReport: 'Client report',
  toolQr: 'QR code scanner',
  toolEncoder: 'Encoder / decoder',
  toolUrl: 'URL reputation',
  toolHash: 'File hash lookup',
  toolIp: 'IP reputation',
  toolDomain: 'Domain WHOIS',
  toolSsl: 'SSL/TLS grade',

  domain: 'Domain',
  domainPlaceholder: 'company.co.il',
  domainRequired: 'Enter a domain, for example company.co.il.',
  auditDomainTitle: 'Domain email security',
  auditDomainDesc: 'Can someone send email in this company’s name? Checks SPF, DMARC, DKIM and more in public DNS.',
  auditDomainHint: 'Reads public DNS records only. Available in audit mode.',
  audit: 'Audit',
  domainMissing: 'This domain does not seem to exist. Check the spelling.',
  rawDns: 'Raw DNS records',
  auditFailed: 'The audit did not finish. Try again.',
  serverFailed: 'Could not reach the server. Check your connection and try again.',

  httpTitle: 'Website security headers',
  httpDesc: 'Does the company website protect its visitors? Checks HTTPS, HSTS, Content Security Policy and other browser protections.',
  httpHint: 'Loads the home page once, like a visitor would, and reads the response headers. Available in audit mode.',
  check: 'Check',
  httpFailed: 'The check did not finish. Try again.',
  rawHeaders: 'Redirects and raw headers',
  noHeaders: 'No security headers received.',

  grade: 'Grade',
  seriousNone: 'No serious problem',
  seriousOne: '1 serious problem',
  seriousMany: 'serious problems',
  copied: 'Copied',
  copy: 'Copy',
  fix: 'Fix',

  passwordTitle: 'Password strength',
  passwordDesc: 'Realistic password analysis using zxcvbn pattern matching, plus a secure local generator.',
  passwordLabel: 'Password to evaluate',
  passwordPlaceholder: 'Type a password...',
  passwordPrivacy: 'The password stays in this browser. It is not sent to the server.',
  veryWeak: 'Very weak',
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
  veryStrong: 'Very strong',
  offlineEstimate: 'Offline fast attack estimate',
  onlineEstimate: 'Online throttled estimate',
  whyScore: 'Why this score?',
  strongMessage: 'Strong against the common patterns zxcvbn checks.',
  generatorTitle: 'Password generator',
  generatorDesc: 'Generate an 18-character password with the browser cryptographic random generator.',
  generatePassword: 'Generate password',
  charsInfo: '18 characters · upper + lower + digits + symbols',

  reportTitle: 'Client report',
  reportDesc: 'A Hebrew report for the business owner, built from the email and website checks. Print it or save it as PDF.',
  clientName: 'Client name',
  preparedBy: 'Prepared by (name and contact, shown on the report)',
  consultantName: 'Consultant name',
  phone: 'Phone',
  email: 'Email',
  website: 'Website (optional)',
  runMissing: 'Run the missing check',
  runBoth: 'Run both checks',
  printPdf: 'Print or save as PDF',
  emailIncluded: 'Email check included',
  emailNotRun: 'Email check not run yet',
  webIncluded: 'Website check included',
  webNotRun: 'Website check not run yet',
  savePdfHint: 'In the print window, choose “Save as PDF” as the destination.',
  reportEmpty: 'The report appears here once at least one check has run for this domain.',
  domainFirst: 'Enter the client’s domain first.',
} as const;

export type TranslationKey = keyof typeof en;

export const he: Record<TranslationKey, string> = {
  languageEnglish: 'English',
  languageHebrew: 'עברית',
  openMenu: 'פתח תפריט',
  closeMenu: 'סגור תפריט',
  home: 'דף הבית',
  privacy: 'מידע ופרטיות',
  auditMode: 'מצב ביקורת',
  auditOn: 'פעיל',
  auditOff: 'כבוי',
  auditHint: 'לעבודה מול לקוח: מסתיר שירותים שאינם מורשים לשימוש מסחרי ואינו שומר היסטוריית מיילים.',
  demoBanner: 'מצב הדגמה: כל התוצאות הן נתונים מדומים של עסק פיקטיבי. דבר לא נשלח לשרת.',
  exitDemo: 'יציאה מהדגמה',

  heroTitle: 'מגלים היכן עסק קטן חשוף — בפגישה אחת.',
  heroBody: 'בודקים אם אפשר לזייף מיילים בשם העסק, אם סיסמאות נחשפו ואם הודעה חשודה היא פישינג. לכל ממצא מצורפת המלצת תיקון ברורה.',
  openTools: 'פתיחת הכלים',
  tryDemo: 'נסו הדגמה',
  demoHint: 'ההדגמה משתמשת בעסק פיקטיבי, כך שאפשר להציג אותה בלי אסימון גישה.',
  sampleSpf: 'SPF מגדיר את שרתי הדואר',
  sampleDmarc: 'DMARC במצב ניטור בלבד (p=none)',
  sampleDkim: 'לא נמצאה חתימת DKIM',
  sampleHsts: 'האתר אינו שולח HSTS',
  sampleCaption: 'דוגמה לתוצאת בדיקת אבטחת דומיין.',
  footerPermission: 'לבדיקות אבטחה באישור בעל העסק ולמודעות פנימית בלבד.',

  groupClientAudit: 'ביקורת לקוח',
  groupUtilities: 'כלי עזר',
  groupPersonal: 'בדיקות אישיות',
  toolDomainAudit: 'אבטחת דואר בדומיין',
  toolHttpHeaders: 'כותרות אבטחה באתר',
  toolEmail: 'ניתוח מייל',
  toolHeaders: 'ניתוח כותרות מייל',
  toolHibp: 'סיסמאות שנחשפו',
  toolPassword: 'חוזק סיסמה',
  toolReport: 'דוח ללקוח',
  toolQr: 'סורק QR',
  toolEncoder: 'קידוד / פענוח',
  toolUrl: 'מוניטין כתובת URL',
  toolHash: 'בדיקת Hash של קובץ',
  toolIp: 'מוניטין כתובת IP',
  toolDomain: 'WHOIS לדומיין',
  toolSsl: 'דירוג SSL/TLS',

  domain: 'דומיין',
  domainPlaceholder: 'company.co.il',
  domainRequired: 'יש להזין דומיין, לדוגמה company.co.il.',
  auditDomainTitle: 'אבטחת דואר בדומיין',
  auditDomainDesc: 'האם ניתן לשלוח מיילים בשם החברה? הבדיקה כוללת SPF, DMARC, DKIM ורשומות DNS נוספות.',
  auditDomainHint: 'הבדיקה קוראת רשומות DNS ציבוריות בלבד. זמינה במצב ביקורת.',
  audit: 'בדיקה',
  domainMissing: 'נראה שהדומיין אינו קיים. בדקו את האיות.',
  rawDns: 'רשומות DNS גולמיות',
  auditFailed: 'הבדיקה לא הושלמה. נסו שוב.',
  serverFailed: 'לא ניתן להגיע לשרת. בדקו את החיבור ונסו שוב.',

  httpTitle: 'כותרות אבטחה באתר',
  httpDesc: 'האם אתר החברה מגן על המבקרים? הבדיקה כוללת HTTPS, HSTS, Content Security Policy והגנות דפדפן נוספות.',
  httpHint: 'טוען פעם אחת את דף הבית כמו מבקר רגיל וקורא את כותרות התגובה. זמין במצב ביקורת.',
  check: 'בדיקה',
  httpFailed: 'הבדיקה לא הושלמה. נסו שוב.',
  rawHeaders: 'הפניות וכותרות גולמיות',
  noHeaders: 'לא התקבלו כותרות אבטחה.',

  grade: 'ציון',
  seriousNone: 'לא נמצאה בעיה חמורה',
  seriousOne: 'נמצאה בעיה חמורה אחת',
  seriousMany: 'בעיות חמורות',
  copied: 'הועתק',
  copy: 'העתקה',
  fix: 'תיקון',

  passwordTitle: 'חוזק סיסמה',
  passwordDesc: 'ניתוח מציאותי של סיסמאות באמצעות zxcvbn, יחד עם מחולל מקומי מאובטח.',
  passwordLabel: 'סיסמה לבדיקה',
  passwordPlaceholder: 'הקלידו סיסמה...',
  passwordPrivacy: 'הסיסמה נשארת בדפדפן ואינה נשלחת לשרת.',
  veryWeak: 'חלשה מאוד',
  weak: 'חלשה',
  fair: 'בינונית',
  strong: 'חזקה',
  veryStrong: 'חזקה מאוד',
  offlineEstimate: 'הערכת פיצוח מהירה במצב לא מקוון',
  onlineEstimate: 'הערכת פיצוח מקוון עם הגבלת קצב',
  whyScore: 'למה התקבל הציון הזה?',
  strongMessage: 'חזקה מול הדפוסים הנפוצים ש-zxcvbn בודק.',
  generatorTitle: 'מחולל סיסמאות',
  generatorDesc: 'יצירת סיסמה באורך 18 תווים באמצעות מחולל אקראי קריפטוגרפי של הדפדפן.',
  generatePassword: 'יצירת סיסמה',
  charsInfo: '18 תווים · אותיות גדולות וקטנות · ספרות · סמלים',

  reportTitle: 'דוח ללקוח',
  reportDesc: 'דוח בעברית לבעל העסק, המבוסס על בדיקות הדואר והאתר. ניתן להדפיס או לשמור כ-PDF.',
  clientName: 'שם הלקוח',
  preparedBy: 'הוכן על ידי (שם ופרטי קשר שיופיעו בדוח)',
  consultantName: 'שם היועץ',
  phone: 'טלפון',
  email: 'אימייל',
  website: 'אתר (אופציונלי)',
  runMissing: 'הרצת הבדיקה החסרה',
  runBoth: 'הרצת שתי הבדיקות',
  printPdf: 'הדפסה או שמירה כ-PDF',
  emailIncluded: 'בדיקת דואר כלולה',
  emailNotRun: 'בדיקת דואר טרם בוצעה',
  webIncluded: 'בדיקת אתר כלולה',
  webNotRun: 'בדיקת אתר טרם בוצעה',
  savePdfHint: 'בחלון ההדפסה בחרו “Save as PDF” כיעד.',
  reportEmpty: 'הדוח יופיע כאן לאחר ביצוע לפחות בדיקה אחת לדומיין.',
  domainFirst: 'יש להזין תחילה את דומיין הלקוח.',
};

function getLanguage(): Language {
  try {
    return localStorage.getItem(KEY) === 'he' ? 'he' : 'en';
  } catch {
    return 'en';
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function setLanguage(language: Language): void {
  try {
    localStorage.setItem(KEY, language);
  } catch {
    // non-essential preference
  }
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getLanguage, () => 'en' as Language);
  const dict = language === 'he' ? he : en;
  return {
    language,
    dir: language === 'he' ? 'rtl' as const : 'ltr' as const,
    t: (key: TranslationKey) => dict[key],
    setLanguage,
  };
}

export function applyStoredLanguage(): void {
  const language = getLanguage();
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
}
