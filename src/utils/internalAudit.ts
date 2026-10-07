import { gradeFor, SEVERITY_ORDER, type Finding, type Score } from './findings';

export type InternalAnswer = 'yes' | 'partial' | 'no' | 'unknown' | 'na';
export type EvidenceStatus = 'client' | 'verified' | 'unverified';
export type InternalCategoryId = 'identity' | 'endpoints' | 'backup' | 'network' | 'remote' | 'data' | 'people';

export type InternalControlId =
  | 'mfa'
  | 'adminAccounts'
  | 'dormantAccounts'
  | 'sharedAccounts'
  | 'joinerLeaver'
  | 'edr'
  | 'patching'
  | 'diskEncryption'
  | 'localAdmins'
  | 'backups'
  | 'firewall'
  | 'wifi'
  | 'networkSegmentation'
  | 'loggingAlerts'
  | 'remoteAccess'
  | 'thirdPartyAccess'
  | 'filePermissions'
  | 'mobileSecurity'
  | 'phishingTraining'
  | 'incidentResponse';

export interface InternalCategory {
  id: InternalCategoryId;
  labelEn: string;
  labelHe: string;
}

export interface InternalControl {
  id: InternalControlId;
  category: InternalCategoryId;
  weight: number;
  labelEn: string;
  labelHe: string;
  helpEn: string;
  helpHe: string;
  impactHe: string;
  fixHe: string;
  effort: 'easy' | 'medium' | 'hard';
}

export interface InternalAuditData {
  answers: Record<InternalControlId, InternalAnswer>;
  observations: Record<InternalControlId, string>;
  evidence: Record<InternalControlId, EvidenceStatus>;
  notes: string;
  completedAt: string | null;
}

export interface InternalScoreCap {
  maxScore: number;
  controlId: InternalControlId;
  reasonEn: string;
  reasonHe: string;
}

export const INTERNAL_CATEGORIES: InternalCategory[] = [
  { id: 'identity', labelEn: 'Identity & accounts', labelHe: 'זהויות וחשבונות' },
  { id: 'endpoints', labelEn: 'Endpoints & servers', labelHe: 'תחנות ושרתים' },
  { id: 'backup', labelEn: 'Backups & recovery', labelHe: 'גיבוי והתאוששות' },
  { id: 'network', labelEn: 'Network & Wi-Fi', labelHe: 'רשת ו-Wi-Fi' },
  { id: 'remote', labelEn: 'Remote & third-party access', labelHe: 'גישה מרחוק וספקים' },
  { id: 'data', labelEn: 'Data & permissions', labelHe: 'מידע והרשאות' },
  { id: 'people', labelEn: 'People & response', labelHe: 'עובדים ותגובה לאירוע' },
];

export const INTERNAL_CONTROLS: InternalControl[] = [
  {
    id: 'mfa', category: 'identity', weight: 14,
    labelEn: 'MFA for email and admin accounts',
    labelHe: 'MFA בדואר ובחשבונות מנהל',
    helpEn: 'Is multi-factor authentication enforced for users, especially administrators?',
    helpHe: 'האם אימות רב-שלבי נאכף למשתמשים, ובמיוחד לחשבונות מנהל?',
    impactHe: 'ללא MFA, סיסמה שנגנבה עלולה להספיק להשתלטות על חשבון עסקי.',
    fixHe: 'להפעיל ולאכוף MFA לפחות בדואר, בחשבונות מנהל ובשירותי ענן מרכזיים.',
    effort: 'easy',
  },
  {
    id: 'adminAccounts', category: 'identity', weight: 7,
    labelEn: 'Separate administrator accounts',
    labelHe: 'חשבונות מנהל נפרדים',
    helpEn: 'Do administrators use a separate privileged account instead of daily admin rights?',
    helpHe: 'האם מנהלים משתמשים בחשבון הרשאות נפרד במקום לעבוד ביום-יום עם הרשאות מנהל?',
    impactHe: 'עבודה שוטפת עם הרשאות מנהל מגדילה את הנזק האפשרי במקרה של פריצה לחשבון או לעמדה.',
    fixHe: 'להפריד בין חשבון משתמש רגיל לחשבון מנהל ולהסיר הרשאות מנהל מיותרות.',
    effort: 'medium',
  },
  {
    id: 'dormantAccounts', category: 'identity', weight: 6,
    labelEn: 'Former and dormant accounts disabled',
    labelHe: 'חשבונות עובדים שעזבו וחשבונות לא פעילים מושבתים',
    helpEn: 'Are accounts disabled promptly when employees leave, and are stale accounts reviewed?',
    helpHe: 'האם חשבונות מושבתים מיד כשעובדים עוזבים והאם חשבונות ישנים נבדקים תקופתית?',
    impactHe: 'חשבונות ישנים שנותרו פעילים יכולים לשמש נקודת כניסה שאיש לא עוקב אחריה.',
    fixHe: 'להשבית חשבונות של עובדים שעזבו ולבצע סקירה תקופתית של חשבונות לא פעילים.',
    effort: 'easy',
  },
  {
    id: 'sharedAccounts', category: 'identity', weight: 5,
    labelEn: 'Shared accounts are avoided or controlled',
    labelHe: 'חשבונות משותפים מצומצמים ומבוקרים',
    helpEn: 'Are shared user/admin accounts avoided, or tightly controlled where unavoidable?',
    helpHe: 'האם נמנעים מחשבונות משותפים, או שהם מבוקרים היטב כאשר אין חלופה?',
    impactHe: 'חשבון משותף מקשה לדעת מי ביצע פעולה ומגדיל את הסיכון שסיסמה תישאר בשימוש לאורך זמן.',
    fixHe: 'להעדיף חשבונות אישיים, ולתעד בעלים, סיסמה חזקה ו-MFA אם חשבון משותף הכרחי.',
    effort: 'medium',
  },
  {
    id: 'joinerLeaver', category: 'identity', weight: 5,
    labelEn: 'Joiner / mover / leaver process',
    labelHe: 'תהליך קליטה, שינוי תפקיד ועזיבת עובד',
    helpEn: 'Is there a repeatable process to grant, change and revoke employee access?',
    helpHe: 'האם קיים תהליך קבוע למתן, שינוי וביטול הרשאות לעובדים?',
    impactHe: 'ללא תהליך מסודר, עובדים עלולים לשמור הרשאות מיותרות או גישה לאחר עזיבה.',
    fixHe: 'להגדיר checklist לקליטה, שינוי תפקיד ועזיבה, כולל ביטול גישה והחזרת ציוד.',
    effort: 'medium',
  },
  {
    id: 'edr', category: 'endpoints', weight: 10,
    labelEn: 'Managed antivirus / EDR',
    labelHe: 'אנטי-וירוס / EDR מנוהל',
    helpEn: 'Do company computers have centrally managed endpoint protection with alerts?',
    helpHe: 'האם מחשבי החברה מוגנים בפתרון Endpoint מנוהל מרכזית עם התראות?',
    impactHe: 'ללא הגנת Endpoint מנוהלת, קבצים זדוניים והתנהגות חשודה עלולים להישאר ללא טיפול.',
    fixHe: 'להתקין פתרון Endpoint מנוהל, לוודא עדכניות ולבדוק שההתראות מגיעות לגורם אחראי.',
    effort: 'medium',
  },
  {
    id: 'patching', category: 'endpoints', weight: 8,
    labelEn: 'Operating system and software updates',
    labelHe: 'עדכוני מערכת ותוכנות',
    helpEn: 'Are operating systems, browsers and business applications patched on a managed schedule?',
    helpHe: 'האם מערכות הפעלה, דפדפנים ותוכנות עסקיות מתעדכנים לפי תהליך מנוהל?',
    impactHe: 'מערכות שלא מתעדכנות נשארות חשופות לחולשות שכבר קיים עבורן תיקון.',
    fixHe: 'לקבוע תהליך עדכונים קבוע ולנטר מחשבים שנשארו מאחור.',
    effort: 'medium',
  },
  {
    id: 'diskEncryption', category: 'endpoints', weight: 6,
    labelEn: 'Disk encryption on laptops and sensitive endpoints',
    labelHe: 'הצפנת דיסק במחשבים ניידים ותחנות רגישות',
    helpEn: 'Is full-disk encryption such as BitLocker or FileVault enabled where sensitive data may be stored?',
    helpHe: 'האם הצפנת דיסק מלאה כגון BitLocker או FileVault מופעלת במחשבים שעלולים להכיל מידע רגיש?',
    impactHe: 'מחשב שאבד או נגנב עלול לחשוף מידע גם בלי כניסה רגילה למערכת.',
    fixHe: 'להפעיל הצפנת דיסק מלאה ולשמור מפתחות שחזור במקום מנוהל ובטוח.',
    effort: 'medium',
  },
  {
    id: 'localAdmins', category: 'endpoints', weight: 6,
    labelEn: 'Local administrator rights restricted',
    labelHe: 'הרשאות מנהל מקומי מוגבלות',
    helpEn: 'Are local administrator rights limited to people and systems that genuinely need them?',
    helpHe: 'האם הרשאות מנהל מקומי מוגבלות רק למי ולמה שבאמת נדרש?',
    impactHe: 'הרשאות מנהל מקומי רחבות מאפשרות לתקיפה להתפשט ולשנות הגדרות אבטחה בקלות רבה יותר.',
    fixHe: 'להסיר הרשאות מנהל מקומי ממשתמשים רגילים ולנהל חריגים באופן מתועד.',
    effort: 'medium',
  },
  {
    id: 'backups', category: 'backup', weight: 13,
    labelEn: 'Backups, isolated copy and restore tests',
    labelHe: 'גיבויים, עותק מבודד ובדיקות שחזור',
    helpEn: 'Are important systems backed up, with at least one separate/off-site copy and restore tests?',
    helpHe: 'האם המערכות החשובות מגובות, כולל עותק נפרד/חיצוני ובדיקת שחזור?',
    impactHe: 'ללא גיבוי מבודד ובדיקת שחזור, תקלה או כופרה עלולות לגרום לאובדן מידע ממושך.',
    fixHe: 'להגדיר גיבוי אוטומטי, עותק נפרד ולבצע בדיקת שחזור תקופתית.',
    effort: 'medium',
  },
  {
    id: 'firewall', category: 'network', weight: 7,
    labelEn: 'Business firewall managed and restricted',
    labelHe: 'חומת אש עסקית מנוהלת ומוגבלת',
    helpEn: 'Is there a managed firewall with unnecessary inbound access disabled and rules reviewed?',
    helpHe: 'האם קיימת חומת אש מנוהלת, ללא גישה נכנסת מיותרת ועם בדיקה תקופתית של החוקים?',
    impactHe: 'חומת אש חלשה או חוקים ישנים עלולים לחשוף שירותים פנימיים ישירות לאינטרנט.',
    fixHe: 'לסגור שירותים נכנסים שאינם נדרשים, לעדכן firmware ולסקור את חוקי חומת האש.',
    effort: 'medium',
  },
  {
    id: 'wifi', category: 'network', weight: 5,
    labelEn: 'Business Wi-Fi security',
    labelHe: 'אבטחת Wi-Fi עסקי',
    helpEn: 'Is business Wi-Fi protected with modern encryption and separated from guest access?',
    helpHe: 'האם ה-Wi-Fi העסקי משתמש בהצפנה מודרנית ומופרד מרשת אורחים?',
    impactHe: 'רשת אלחוטית חלשה או משותפת לאורחים עלולה לאפשר גישה לא מורשית למשאבי העסק.',
    fixHe: 'להשתמש ב-WPA2/WPA3, סיסמה חזקה או אימות ארגוני, ולהפריד רשת אורחים.',
    effort: 'easy',
  },
  {
    id: 'networkSegmentation', category: 'network', weight: 4,
    labelEn: 'Network segmentation where needed',
    labelHe: 'הפרדת רשתות היכן שנדרש',
    helpEn: 'Are guest, IoT, server or other higher-risk devices separated from business endpoints where appropriate?',
    helpHe: 'האם רשת אורחים, IoT, שרתים או ציוד בסיכון גבוה מופרדים מתחנות העבודה כאשר הדבר נדרש?',
    impactHe: 'רשת שטוחה מאפשרת לתקיפה על התקן אחד להגיע בקלות רבה יותר למערכות אחרות.',
    fixHe: 'להפריד רשתות לפי צורך עסקי וסיכון באמצעות VLAN וכללי firewall מתאימים.',
    effort: 'hard',
  },
  {
    id: 'loggingAlerts', category: 'network', weight: 5,
    labelEn: 'Security logging and alert review',
    labelHe: 'לוגים והתראות אבטחה נבדקים',
    helpEn: 'Are important security alerts and logs reviewed by someone responsible?',
    helpHe: 'האם התראות ולוגים חשובים נבדקים על ידי גורם אחראי?',
    impactHe: 'גם כלי אבטחה טוב אינו מועיל מספיק אם איש אינו רואה התראות על פעילות חריגה.',
    fixHe: 'להגדיר מי מקבל התראות חשובות, מה נבדק ובאיזו תדירות, ולשמור לוגים רלוונטיים.',
    effort: 'medium',
  },
  {
    id: 'remoteAccess', category: 'remote', weight: 9,
    labelEn: 'VPN and remote access secured',
    labelHe: 'VPN וגישה מרחוק מאובטחים',
    helpEn: 'Is remote access limited, protected with MFA and disabled when no longer needed?',
    helpHe: 'האם גישה מרחוק מוגבלת, מוגנת ב-MFA ומבוטלת כשאינה נדרשת?',
    impactHe: 'גישה מרחוק חלשה היא נקודת כניסה נפוצה לחשבונות ולרשת הארגונית.',
    fixHe: 'להגביל גישה מרחוק, לאכוף MFA, להסיר חשבונות ישנים ולתעד מי מורשה להתחבר.',
    effort: 'medium',
  },
  {
    id: 'thirdPartyAccess', category: 'remote', weight: 5,
    labelEn: 'Vendor and third-party access controlled',
    labelHe: 'גישת ספקים וצדדים שלישיים מבוקרת',
    helpEn: 'Is supplier/support access time-limited, attributable and removed when no longer needed?',
    helpHe: 'האם גישת ספקים ותמיכה מוגבלת בזמן, ניתנת לזיהוי ומבוטלת כשאינה נדרשת?',
    impactHe: 'גישה קבועה של ספק חיצוני מגדילה את שטח התקיפה ותלויה גם באבטחה של אותו ספק.',
    fixHe: 'להשתמש בחשבונות נפרדים לספקים, MFA, הרשאות מינימליות וביטול גישה לאחר סיום העבודה.',
    effort: 'medium',
  },
  {
    id: 'filePermissions', category: 'data', weight: 6,
    labelEn: 'File sharing and permissions',
    labelHe: 'שיתופי קבצים והרשאות',
    helpEn: 'Are shared folders and cloud files limited to people who actually need access?',
    helpHe: 'האם תיקיות משותפות וקבצי ענן מוגבלים רק למי שבאמת זקוק לגישה?',
    impactHe: 'הרשאות רחבות מדי מאפשרות לעובדים או לחשבון שנפרץ להגיע למידע שאינו נדרש להם.',
    fixHe: 'לסקור שיתופים והרשאות, להסיר גישה מיותרת ולהשתמש בקבוצות במקום הרשאות אישיות.',
    effort: 'medium',
  },
  {
    id: 'mobileSecurity', category: 'data', weight: 4,
    labelEn: 'Business data on mobile devices protected',
    labelHe: 'מידע עסקי במכשירים ניידים מוגן',
    helpEn: 'Are phones/tablets with business email or data protected with screen lock and manageable access?',
    helpHe: 'האם טלפונים וטאבלטים עם דואר או מידע עסקי מוגנים בנעילת מסך ובגישה שניתן לנהל או לבטל?',
    impactHe: 'מכשיר נייד שאבד עלול להשאיר גישה פעילה לדואר ולמידע עסקי.',
    fixHe: 'לדרוש נעילת מסך, עדכונים, יכולת ביטול גישה והפרדה מתאימה בין מידע עסקי לפרטי.',
    effort: 'medium',
  },
  {
    id: 'phishingTraining', category: 'people', weight: 4,
    labelEn: 'Phishing awareness',
    labelHe: 'מודעות לפישינג',
    helpEn: 'Do employees receive basic phishing guidance or periodic awareness training?',
    helpHe: 'האם העובדים מקבלים הדרכה בסיסית לזיהוי פישינג או תרגול תקופתי?',
    impactHe: 'ללא מודעות בסיסית, הודעות התחזות עלולות להוביל למסירת סיסמאות או לפתיחת קבצים מסוכנים.',
    fixHe: 'לקיים הדרכה קצרה ותקופתית ולהגדיר דרך פשוטה לדיווח על הודעות חשודות.',
    effort: 'easy',
  },
  {
    id: 'incidentResponse', category: 'people', weight: 6,
    labelEn: 'Basic incident response plan',
    labelHe: 'תוכנית בסיסית לתגובה לאירוע אבטחה',
    helpEn: 'Does the business know who to contact and what to do after account compromise, ransomware or data loss?',
    helpHe: 'האם ברור למי פונים ומה עושים במקרה של פריצת חשבון, כופרה או אובדן מידע?',
    impactHe: 'ללא תהליך בסיסי, זמן יקר מתבזבז בזמן אירוע והנזק עלול לגדול.',
    fixHe: 'לתעד אנשי קשר, צעדי בידוד ודיווח בסיסיים ולשמור עותק נגיש גם בזמן תקלה.',
    effort: 'medium',
  },
];

function answerOf(data: InternalAuditData, id: InternalControlId): InternalAnswer {
  return data.answers?.[id] ?? 'unknown';
}

function observationOf(data: InternalAuditData, id: InternalControlId): string {
  return data.observations?.[id] ?? '';
}

export function evidenceOf(data: InternalAuditData, id: InternalControlId): EvidenceStatus {
  return data.evidence?.[id] ?? 'unverified';
}

export function emptyInternalAudit(): InternalAuditData {
  return {
    answers: Object.fromEntries(INTERNAL_CONTROLS.map((c) => [c.id, 'unknown'])) as Record<InternalControlId, InternalAnswer>,
    observations: Object.fromEntries(INTERNAL_CONTROLS.map((c) => [c.id, ''])) as Record<InternalControlId, string>,
    evidence: Object.fromEntries(INTERNAL_CONTROLS.map((c) => [c.id, 'unverified'])) as Record<InternalControlId, EvidenceStatus>,
    notes: '',
    completedAt: null,
  };
}

export function hasAssessedInternalControls(data: InternalAuditData | null): boolean {
  if (!data) return false;
  return INTERNAL_CONTROLS.some((c) => ['yes', 'partial', 'no'].includes(answerOf(data, c.id)));
}

export function isInternalAuditComplete(data: InternalAuditData | null): boolean {
  if (!data) return false;
  return INTERNAL_CONTROLS.every((c) => answerOf(data, c.id) !== 'unknown');
}

function findingFor(control: InternalControl, answer: Exclude<InternalAnswer, 'unknown' | 'na'>, observation: string): Finding {
  if (answer === 'yes') {
    return {
      id: `internal-${control.id}-ok`,
      control: control.labelEn,
      severity: 'ok',
      penalty: 0,
      title: `${control.labelEn}: in place`,
      impact: 'The control is reported as implemented.',
      recommendation: '—',
      detail: observation.trim() || undefined,
      params: {
        heTitle: `${control.labelHe} — תקין`,
        heImpact: 'הבקרה דווחה כמיושמת.',
        heFix: '—',
        effort: control.effort,
      },
    };
  }

  const partial = answer === 'partial';
  return {
    id: `internal-${control.id}-${answer}`,
    control: control.labelEn,
    severity: partial ? 'medium' : (control.weight >= 10 ? 'high' : 'medium'),
    penalty: partial ? Math.round(control.weight / 2) : control.weight,
    title: partial ? `${control.labelEn}: partially implemented` : `${control.labelEn}: not implemented`,
    impact: 'Consultant questionnaire finding.',
    recommendation: control.fixHe,
    detail: observation.trim() || undefined,
    params: {
      heTitle: partial ? `${control.labelHe} — מיושם חלקית` : `${control.labelHe} — לא מיושם`,
      heImpact: control.impactHe,
      heFix: control.fixHe,
      effort: control.effort,
    },
  };
}

export function internalScoreCaps(data: InternalAuditData): InternalScoreCap[] {
  const caps: InternalScoreCap[] = [];
  if (answerOf(data, 'mfa') === 'no') {
    caps.push({
      maxScore: 89, controlId: 'mfa',
      reasonEn: 'MFA is not implemented for email/admin accounts.',
      reasonHe: 'MFA אינו מיושם בדואר ובחשבונות מנהל.',
    });
  }
  if (answerOf(data, 'backups') === 'no') {
    caps.push({
      maxScore: 74, controlId: 'backups',
      reasonEn: 'No adequate backup and recovery control is in place.',
      reasonHe: 'לא קיים מנגנון גיבוי והתאוששות מספק.',
    });
  }
  if (answerOf(data, 'edr') === 'no') {
    caps.push({
      maxScore: 89, controlId: 'edr',
      reasonEn: 'Managed endpoint protection / EDR is not in place.',
      reasonHe: 'אין הגנת Endpoint / EDR מנוהלת.',
    });
  }
  if (answerOf(data, 'remoteAccess') === 'no') {
    caps.push({
      maxScore: 74, controlId: 'remoteAccess',
      reasonEn: 'Remote access exists without adequate security controls.',
      reasonHe: 'גישה מרחוק קיימת ללא בקרות אבטחה מספקות.',
    });
  }
  return caps.sort((a, b) => a.maxScore - b.maxScore);
}

export function scoreInternalAudit(data: InternalAuditData): Score {
  const assessed = INTERNAL_CONTROLS.filter((c) => ['yes', 'partial', 'no'].includes(answerOf(data, c.id)));
  if (assessed.length === 0) return { score: 0, grade: 'E', findings: [] };

  const max = assessed.reduce((sum, c) => sum + c.weight, 0);
  const earned = assessed.reduce((sum, c) => {
    const a = answerOf(data, c.id);
    if (a === 'yes') return sum + c.weight;
    if (a === 'partial') return sum + c.weight / 2;
    return sum;
  }, 0);

  const weightedScore = Math.round((earned / max) * 100);
  const cap = internalScoreCaps(data)[0]?.maxScore ?? 100;
  const score = Math.min(weightedScore, cap);
  const findings = assessed
    .map((c) => findingFor(c, answerOf(data, c.id) as 'yes' | 'partial' | 'no', observationOf(data, c.id)))
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  return { score, grade: gradeFor(score), findings };
}
