import { FileLock2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useLanguage } from '../i18n';

interface Row {
  tool: [string, string];
  sentTo: [string, string];
  data: [string, string];
  kept: [string, string];
  audit: 'allowed' | 'hidden';
}

const ROWS: Row[] = [
  {
    tool: ['Email analysis', 'ניתוח אימייל'],
    sentTo: ['Nowhere — runs in the browser', 'לשום מקום — פועל בדפדפן'],
    data: ['—', '—'],
    kept: ['Last 5 analyses in this browser (personal mode only)', '5 הניתוחים האחרונים בדפדפן (במצב אישי בלבד)'],
    audit: 'allowed',
  },
  {
    tool: ['Email analysis → link scan', 'ניתוח אימייל → סריקת קישורים'],
    sentTo: ['VirusTotal (via /api/vt-scan-urls)', 'VirusTotal דרך /api/vt-scan-urls'],
    data: ['Up to 5 suspicious links', 'עד 5 קישורים חשודים'],
    kept: ['VirusTotal may retain submitted URLs', 'VirusTotal עשוי לשמור כתובות URL שנשלחו'],
    audit: 'hidden',
  },
  {
    tool: ['Domain email security', 'אבטחת דואר בדומיין'],
    sentTo: ['Cloudflare public DNS (via /api/domain-audit)', 'DNS ציבורי של Cloudflare דרך /api/domain-audit'],
    data: ['Domain name and DNS sub-names', 'שם הדומיין ותתי-שמות DNS'],
    kept: ['Nothing on our side', 'לא נשמר אצלנו'],
    audit: 'allowed',
  },
  {
    tool: ['Website security headers', 'כותרות אבטחה באתר'],
    sentTo: ['The company website and public DNS', 'אתר החברה ו-DNS ציבורי'],
    data: ['One home-page request; response headers only', 'בקשה אחת לדף הבית; נקראות רק כותרות התגובה'],
    kept: ['Nothing on our side', 'לא נשמר אצלנו'],
    audit: 'allowed',
  },
  {
    tool: ['Email header analyzer', 'ניתוח כותרות אימייל'],
    sentTo: ['Nowhere — runs in the browser', 'לשום מקום — פועל בדפדפן'],
    data: ['—', '—'],
    kept: ['Nothing', 'לא נשמר'],
    audit: 'allowed',
  },
  {
    tool: ['Password strength', 'חוזק סיסמה'],
    sentTo: ['Nowhere — runs in the browser', 'לשום מקום — פועל בדפדפן'],
    data: ['—', '—'],
    kept: ['Nothing', 'לא נשמר'],
    audit: 'allowed',
  },
  {
    tool: ['Have I Been Pwned password check', 'בדיקת סיסמה ב-Have I Been Pwned'],
    sentTo: ['api.pwnedpasswords.com', 'api.pwnedpasswords.com'],
    data: ['First 5 characters of the password SHA-1 hash', '5 התווים הראשונים של SHA-1 של הסיסמה'],
    kept: ['Nothing on our side', 'לא נשמר אצלנו'],
    audit: 'allowed',
  },
  {
    tool: ['Encoder / decoder', 'מקודד / מפענח'],
    sentTo: ['Nowhere — runs in the browser', 'לשום מקום — פועל בדפדפן'],
    data: ['—', '—'],
    kept: ['Nothing', 'לא נשמר'],
    audit: 'allowed',
  },
  {
    tool: ['QR scanner', 'סורק QR'],
    sentTo: ['Nowhere — camera and image stay in the browser', 'לשום מקום — המצלמה והתמונה נשארות בדפדפן'],
    data: ['—', '—'],
    kept: ['Nothing', 'לא נשמר'],
    audit: 'allowed',
  },
  {
    tool: ['URL, hash, IP and WHOIS lookups', 'בדיקות URL, Hash, IP ו-WHOIS'],
    sentTo: ['VirusTotal (via /api/vt-*)', 'VirusTotal דרך /api/vt-*'],
    data: ['The value entered for lookup', 'הערך שהוזן לבדיקה'],
    kept: ['Subject to VirusTotal policy', 'כפוף למדיניות VirusTotal'],
    audit: 'hidden',
  },
  {
    tool: ['SSL/TLS checker', 'בדיקת SSL/TLS'],
    sentTo: ['Qualys SSL Labs (via /api/ssl-check)', 'Qualys SSL Labs דרך /api/ssl-check'],
    data: ['Domain name', 'שם הדומיין'],
    kept: ['SSL Labs may cache results', 'SSL Labs עשוי לשמור תוצאות במטמון'],
    audit: 'hidden',
  },
];

export default function PrivacyPage() {
  const { t, language } = useLanguage();
  const i = language === 'he' ? 1 : 0;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<FileLock2 className="w-5 h-5 text-brand" />}
        title={t('privacyTitle')}
        description={t('privacyDesc')}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 text-sm">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-start">
            <thead className="bg-surface text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('tool')}</th>
                <th className="px-4 py-3 font-semibold">{t('sentTo')}</th>
                <th className="px-4 py-3 font-semibold">{t('dataSent')}</th>
                <th className="px-4 py-3 font-semibold">{t('kept')}</th>
                <th className="px-4 py-3 font-semibold">{t('auditModeColumn')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink-2">
              {ROWS.map((row) => (
                <tr key={row.tool[0]}>
                  <td className="px-4 py-3 font-medium text-ink">{row.tool[i]}</td>
                  <td className="px-4 py-3">{row.sentTo[i]}</td>
                  <td className="px-4 py-3">{row.data[i]}</td>
                  <td className="px-4 py-3">{row.kept[i]}</td>
                  <td className={`px-4 py-3 ${row.audit === 'hidden' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {row.audit === 'hidden' ? t('hiddenNonCommercial') : t('available')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-muted">
          <h2 className="text-base font-semibold text-ink">{t('serverSide')}</h2>
          <p>{t('noDatabase')}</p>
          <p>{t('hostingLogs')}</p>
          <p>{t('tokenStorage')}</p>
        </div>
      </div>
    </div>
  );
}
