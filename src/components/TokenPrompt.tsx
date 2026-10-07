import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { setToken } from '../utils/apiClient';

interface TokenPromptProps {
  onClose: () => void;
}

/** Asks for the personal access token the /api routes require. */
export default function TokenPrompt({ onClose }: TokenPromptProps) {
  const [value, setValue] = useState('');

  function save() {
    if (!value.trim()) return;
    setToken(value);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="token-title">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 id="token-title" className="text-base font-semibold text-white">Access token</h2>
            <p className="text-sm text-slate-400 mt-1">
              Online lookups are private. Enter your access token, then run the check again.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close">
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
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 text-sm"
        />
        <p className="text-xs text-slate-500">Kept for this browser tab only.</p>
        <button
          onClick={save}
          disabled={!value.trim()}
          className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-semibold py-2.5 text-sm transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
