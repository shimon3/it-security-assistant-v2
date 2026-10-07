import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface DomainCheckFormProps {
  id: string;
  initialValue: string;
  loading: boolean;
  error: string;
  hint: string;
  buttonLabel: string;
  onSubmit: (domain: string) => void;
}

/** Domain field + action button shared by the audit pages. */
export default function DomainCheckForm({ id, initialValue, loading, error, hint, buttonLabel, onSubmit }: DomainCheckFormProps) {
  const [value, setValue] = useState(initialValue);
  const [localError, setLocalError] = useState('');
  const shownError = localError || error;

  function submit() {
    if (!value.trim()) {
      setLocalError('Enter a domain, for example company.co.il.');
      return;
    }
    setLocalError('');
    onSubmit(value.trim());
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-ink-2">Domain</label>
      <div className="flex gap-3">
        <input
          id={id}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => { setValue(e.target.value); if (localError) setLocalError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="company.co.il"
          aria-invalid={!!shownError}
          aria-describedby={`${id}-hint`}
          className="flex-1 min-w-0 bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors text-sm"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {buttonLabel}
        </button>
      </div>
      {shownError && <p className="text-red-700 text-sm" role="alert">{shownError}</p>}
      <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
    </div>
  );
}
