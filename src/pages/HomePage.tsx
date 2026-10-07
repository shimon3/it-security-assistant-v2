import { Shield, ArrowRight, Check, X as XIcon, PlayCircle } from 'lucide-react';
import { TOOL_GROUPS, type Tool } from '../components/toolGroups';
import LanguageSwitch from '../components/LanguageSwitch';
import { useLanguage, type TranslationKey } from '../i18n';

interface HomePageProps {
  onStart: () => void;
  onDemo: () => void;
}

const TOOL_KEY: Record<Tool, TranslationKey> = {
  domainaudit: 'toolDomainAudit', httpheaders: 'toolHttpHeaders', email: 'toolEmail',
  headers: 'toolHeaders', hibp: 'toolHibp', password: 'toolPassword', report: 'toolReport',
  qr: 'toolQr', encoder: 'toolEncoder', url: 'toolUrl', hash: 'toolHash', ip: 'toolIp',
  domain: 'toolDomain', ssl: 'toolSsl', privacy: 'privacy',
};

const GROUP_KEY: Record<string, TranslationKey> = {
  'Client audit': 'groupClientAudit',
  Utilities: 'groupUtilities',
  'Personal lookups': 'groupPersonal',
};

export default function HomePage({ onStart, onDemo }: HomePageProps) {
  const { t, dir } = useLanguage();
  const sample = [
    { ok: true, text: t('sampleSpf') },
    { ok: false, text: t('sampleDmarc') },
    { ok: false, text: t('sampleDkim') },
    { ok: false, text: t('sampleHsts') },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 px-5 sm:px-8 flex items-center gap-2.5 border-b border-line bg-surface">
        <Shield className="w-5 h-5 text-brand shrink-0" strokeWidth={2} />
        <span className="font-semibold tracking-tight flex-1">IT Security Assistant</span>
        <LanguageSwitch />
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
        <section className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">{t('heroTitle')}</h1>
            <p className="text-lg text-ink-2 leading-relaxed max-w-[34rem]">{t('heroBody')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={onStart} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-strong text-white font-semibold px-6 py-3.5 rounded-lg text-base transition-colors">
                {t('openTools')}
                <ArrowRight className={`w-4 h-4 ${dir === 'he' ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={onDemo} className="inline-flex items-center gap-2 border border-line-strong bg-surface hover:border-brand hover:text-brand-strong text-ink font-semibold px-6 py-3.5 rounded-lg text-base transition-colors">
                <PlayCircle className="w-4 h-4" />
                {t('tryDemo')}
              </button>
            </div>
            <p className="text-sm text-muted">{t('demoHint')}</p>
          </div>

          <figure className="rounded-xl border border-line bg-surface p-6 sm:p-7" aria-label={t('sampleCaption')}>
            <div className="flex items-center gap-5 pb-5 border-b border-line">
              <div className="w-20 h-20 shrink-0 rounded-2xl border-[3px] border-orange-500 bg-orange-50 flex items-center justify-center">
                <span className="text-5xl font-bold text-orange-700 leading-none">D</span>
              </div>
              <div>
                <p className="text-sm text-muted" dir="ltr">example-shop.co.il</p>
                <p className="text-2xl font-semibold" dir="ltr">47 / 100</p>
              </div>
            </div>
            <ul className="pt-4 space-y-2.5">
              {sample.map((s) => (
                <li key={s.text} className="flex items-start gap-2.5 text-sm">
                  {s.ok ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-700" aria-label="OK" /> : <XIcon className="w-4 h-4 mt-0.5 shrink-0 text-red-700" aria-label="Problem" />}
                  <span className={s.ok ? 'text-muted' : 'text-ink'}>{s.text}</span>
                </li>
              ))}
            </ul>
            <figcaption className="pt-5 text-xs text-faint">{t('sampleCaption')}</figcaption>
          </figure>
        </section>

        <section className="mt-20 grid gap-10 sm:grid-cols-3">
          {TOOL_GROUPS.map((g) => (
            <div key={g.name}>
              <h2 className="text-sm font-semibold text-ink pb-3 mb-3 border-b border-line">{t(GROUP_KEY[g.name])}</h2>
              <ul className="space-y-2">
                {g.tools.map(({ id, icon: Icon }) => (
                  <li key={id}>
                    <button onClick={onStart} className="flex items-center gap-2.5 text-sm text-ink-2 hover:text-brand transition-colors">
                      <Icon className="w-4 h-4 text-muted shrink-0" />
                      {t(TOOL_KEY[id])}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>

      <footer className="px-5 sm:px-8 py-5 border-t border-line text-sm text-muted text-center">{t('footerPermission')}</footer>
    </div>
  );
}
