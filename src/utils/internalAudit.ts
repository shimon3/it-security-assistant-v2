import { gradeFor, SEVERITY_ORDER, type Finding, type Score } from './findings';

export type InternalAnswer = 'yes' | 'partial' | 'no' | 'unknown' | 'na';
export type InternalControlId =
  | 'mfa'
  | 'backups'
  | 'edr'
  | 'adminAccounts'
  | 'patching'
  | 'remoteAccess'
  | 'wifi'
  | 'filePermissions'
  | 'phishingTraining';

export interface InternalControl {
  id: InternalControlId;
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
  notes: string;
  completedAt: string | null;
}

export const INTERNAL_CONTROLS: InternalControl[] = [
  {
    id: 'mfa', weight: 18,
    labelEn: 'MFA for email and admin accounts',
    labelHe: 'MFA בדואר ובחשבונות מנהל',
    helpEn: 'Is multi-factor authentication enforced for users, especially administrators?',
    helpHe: 'האם אימות רב-שלבי נאכף למשתמשים, ובמיוחד לחשבונות מנהל?',
    impactHe: 'ללא MFA, סיסמה שנגנבה עלולה להספיק להשתלטות על חשבון עסקי.',
    fixHe: 'להפעיל ולאכוף MFA לפחות בדואר, בחשבונות מנהל ובשירותי ענן מרכזיים.',
    effort: 'easy',
  },
  {
    id: 'backups', weight: 16,
    labelEn: 'Backups and off-site copy',
    labelHe: 'גיבויים ועותק מחוץ למערכת',
    helpEn: 'Are important systems backed up, with at least one separate/off-site copy and restore tests?',
    helpHe: 'האם המערכות החשובות מגובות, כולל עותק נפרד/חיצוני ובדיקת שחזור?',
    impactHe: 'ללא גיבוי מבודד ובדיקת שחזור, תקלה או כופרה עלולות לגרום לאובדן מידע ממושך.',
    fixHe: 'להגדיר גיבוי אוטומטי, עותק נפרד ולבצע בדיקת שחזור תקופתית.',
    effort: 'medium',
  },
  {
    id: 'edr', weight: 14,
    labelEn: 'Managed antivirus / EDR',
    labelHe: 'אנטי-וירוס / EDR מנוהל',
    helpEn: 'Do company computers have centrally managed endpoint protection with alerts?',
    helpHe: 'האם מחשבי החברה מוגנים בפתרון Endpoint מנוהל מרכזית עם התראות?',
    impactHe: 'ללא הגנת Endpoint מנוהלת, קבצים זדוניים והתנהגות חשודה עלולים להישאר ללא טיפול.',
    fixHe: 'להתקין פתרון Endpoint מנוהל, לוודא עדכניות ולבדוק שההתראות מגיעות לגורם אחראי.',
    effort: 'medium',
  },
  {
    id: 'adminAccounts', weight: 12,
    labelEn: 'Separate administrator accounts',
    labelHe: 'חשבונות מנהל נפרדים',
    helpEn: 'Do administrators use a separate privileged account instead of daily admin rights?',
    helpHe: 'האם מנהלים משתמשים בחשבון הרשאות נפרד במקום לעבוד ביום-יום עם הרשאות מנהל?',
    impactHe: 'עבודה שוטפת עם הרשאות מנהל מגדילה את הנזק האפשרי במקרה של פריצה לחשבון או לעמדה.',
    fixHe: 'להפריד בין חשבון משתמש רגיל לחשבון מנהל ולהסיר הרשאות מנהל מקומיות מיותרות.',
    effort: 'medium',
  },
  {
    id: 'patching', weight: 12,
    labelEn: 'Operating system and software updates',
    labelHe: 'עדכוני מערכת ותוכנות',
    helpEn: 'Are operating systems, browsers and business applications patched on a managed schedule?',
    helpHe: 'האם מערכות הפעלה, דפדפנים ותוכנות עסקיות מתעדכנים לפי תהליך מנוהל?',
    impactHe: 'מערכות שלא מתעדכנות נשארות חשופות לחולשות שכבר קיים עבורן תיקון.',
    fixHe: 'לקבוע תהליך עדכונים קבוע ולנטר מחשבים שנשארו מאחור.',
    effort: 'medium',
  },
  {
    id: 'remoteAccess', weight: 10,
    labelEn: 'VPN and remote access',
    labelHe: 'VPN וגישה מרחוק',
    helpEn: 'Is remote access limited, protected with MFA and disabled when no longer needed?',
    helpHe: 'האם גישה מרחוק מוגבלת, מוגנת ב-MFA ומבוטלת כשאינה נדרשת?',
    impactHe: 'גישה מרחוק חלשה היא נקודת כניסה נפוצה לחשבונות ולרשת הארגונית.',
    fixHe: 'להגביל גישה מרחוק, לאכוף MFA, להסיר חשבונות ישנים ולתעד מי מורשה להתחבר.',
    effort: 'medium',
  },
  {
    id: 'wifi', weight: 7,
    labelEn: 'Business Wi-Fi security',
    labelHe: 'אבטחת Wi-Fi עסקי',
    helpEn: 'Is business Wi-Fi protected with modern encryption and separated from guest access?',
    helpHe: 'האם ה-Wi-Fi העסקי משתמש בהצפנה מודרנית ומופרד מרשת אורחים?',
    impactHe: 'רשת אלחוטית חלשה או משותפת לאורחים עלולה לאפשר גישה לא מורשית למשאבי העסק.',
    fixHe: 'להשתמש ב-WPA2/WPA3, סיסמה חזקה או אימות ארגוני, ולהפריד רשת אורחים.',
    effort: 'easy',
  },
  {
    id: 'filePermissions', weight: 7,
    labelEn: 'File sharing and permissions',
    labelHe: 'שיתופי קבצים והרשאות',
    helpEn: 'Are shared folders and cloud files limited to people who actually need access?',
    helpHe: 'האם תיקיות משותפות וקבצי ענן מוגבלים רק למי שבאמת זקוק לגישה?',
    impactHe: 'הרשאות רחבות מדי מאפשרות לעובדים או לחשבון שנפרץ להגיע למידע שאינו נדרש להם.',
    fixHe: 'לסקור שיתופים והרשאות, להסיר גישה מיותרת ולהשתמש בקבוצות במקום הרשאות אישיות.',
    effort: 'medium',
  },
  {
    id: 'phishingTraining', weight: 4,
    labelEn: 'Phishing awareness',
    labelHe: 'מודעות לפישינג',
    helpEn: 'Do employees receive basic phishing guidance or periodic awareness training?',
    helpHe: 'האם העובדים מקבלים הדרכה בסיסית לזיהוי פישינג או תרגול תקופתי?',
    impactHe: 'ללא מודעות בסיסית, הודעות התחזות עלולות להוביל למסירת סיסמאות או לפתיחת קבצים מסוכנים.',
    fixHe: 'לקיים הדרכה קצרה ותקופתית ולהגדיר דרך פשוטה לדיווח על הודעות חשודות.',
    effort: 'easy',
  },
];

export function emptyInternalAudit(): InternalAuditData {
  return {
    answers: Object.fromEntries(INTERNAL_CONTROLS.map((c) => [c.id, 'unknown'])) as Record<InternalControlId, InternalAnswer>,
    observations: Object.fromEntries(INTERNAL_CONTROLS.map((c) => [c.id, ''])) as Record<InternalControlId, string>,
    notes: '',
    completedAt: null,
  };
}

export function hasAssessedInternalControls(data: InternalAuditData | null): boolean {
  if (!data) return false;
  return INTERNAL_CONTROLS.some((c) => ['yes', 'partial', 'no'].includes(data.answers[c.id]));
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
    severity: partial ? 'medium' : (control.weight >= 14 ? 'high' : 'medium'),
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

export function scoreInternalAudit(data: InternalAuditData): Score {
  const assessed = INTERNAL_CONTROLS.filter((c) => ['yes', 'partial', 'no'].includes(data.answers[c.id]));
  if (assessed.length === 0) return { score: 0, grade: 'E', findings: [] };

  const max = assessed.reduce((sum, c) => sum + c.weight, 0);
  const earned = assessed.reduce((sum, c) => {
    const a = data.answers[c.id];
    if (a === 'yes') return sum + c.weight;
    if (a === 'partial') return sum + c.weight / 2;
    return sum;
  }, 0);
  const score = Math.round((earned / max) * 100);
  const findings = assessed
    .map((c) => findingFor(c, data.answers[c.id] as 'yes' | 'partial' | 'no', data.observations[c.id] ?? ''))
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  return { score, grade: gradeFor(score), findings };
}
