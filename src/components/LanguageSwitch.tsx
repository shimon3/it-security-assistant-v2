import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n';

export default function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const next = language === 'en' ? 'he' : 'en';

  return (
    <button
      type="button"
      onClick={() => setLanguage(next)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand-strong transition-colors"
      aria-label={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
      title={language === 'en' ? 'עברית' : 'English'}
    >
      {!compact && <Languages className="w-3.5 h-3.5" />}
      <span dir="ltr">{language === 'en' ? 'HE' : 'EN'}</span>
    </button>
  );
}
