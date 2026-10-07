import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { setToken } from '../utils/apiClient';
import { useLanguage } from '../i18n';

interface TokenPromptProps {
  onClose: () => void;
}

/** Asks for the personal access token the /api routes require. */
export default function TokenPrompt({ onClose }: TokenPromptProps) {
  const [value, setValue] = useState('');
  const { t } = useLanguage();

  function save() {
    if (!value.trim()) return;
    setToken(value);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4" role="dialog" aria-modal="true" aria-labelledby="token-title">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 space-y-4">
        <div className="flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 id="token-title" className="text-base font-semibold text-ink">{t('accessToken')}</h2>
            <p className="text-sm text-muted mt-1">
              {t('accessTokenDesc')}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label={t('close')}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Token"
          autoComplete="current-password"
          className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink placeholder-faint focus:outline-none focus:border-brand text-sm"
        />
        <p className="text-xs text-muted">{t('tokenTabOnly')}</p>
        <button
          onClick={save}
          disabled={!value.trim()}
          className="w-full rounded-xl bg-brand hover:bg-brand-strong disabled:opacity-40 text-white font-semibold py-2.5 text-sm transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
