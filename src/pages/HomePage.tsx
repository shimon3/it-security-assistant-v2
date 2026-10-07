import { Shield, ArrowRight, Check, X as XIcon, PlayCircle } from 'lucide-react';
import { TOOL_GROUPS } from '../components/toolGroups';

interface HomePageProps {
  onStart: () => void;
  onDemo: () => void;
}

// What a typical small-business domain looks like on the first audit: shown as the hero
// so the visitor sees the output before reading about it. Illustrative values.
const SAMPLE = [
  { ok: true, text: 'SPF lists the mail servers' },
  { ok: false, text: 'DMARC only monitors (p=none)' },
  { ok: false, text: 'No DKIM signature found' },
  { ok: false, text: 'Website sends no HSTS header' },
];

export default function HomePage({ onStart, onDemo }: HomePageProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 px-5 sm:px-8 flex items-center gap-2.5 border-b border-line bg-surface">
        <Shield className="w-5 h-5 text-brand shrink-0" strokeWidth={2} />
        <span className="font-semibold tracking-tight">IT Security Assistant</span>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
        <section className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
              Find where a small business is exposed, in one sitting.
            </h1>
            <p className="text-lg text-ink-2 leading-relaxed max-w-[34rem]">
              Check whether anyone can send email in the company’s name, whether staff passwords have leaked,
              and whether that suspicious email is phishing. Every finding comes with a fix in plain words.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-strong text-white font-semibold px-6 py-3.5 rounded-lg text-base transition-colors"
              >
                Open the tools
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onDemo}
                className="inline-flex items-center gap-2 border border-line-strong bg-surface hover:border-brand hover:text-brand-strong text-ink font-semibold px-6 py-3.5 rounded-lg text-base transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Try the demo
              </button>
            </div>
            <p className="text-sm text-muted">The demo uses a made-up shop, so you can show it to anyone without an access token.</p>
          </div>

          <figure className="rounded-xl border border-line bg-surface p-6 sm:p-7" aria-label="Example audit result">
            <div className="flex items-center gap-5 pb-5 border-b border-line">
              <div className="w-20 h-20 shrink-0 rounded-2xl border-[3px] border-orange-500 bg-orange-50 flex items-center justify-center">
                <span className="text-5xl font-bold text-orange-700 leading-none">D</span>
              </div>
              <div>
                <p className="text-sm text-muted">example-shop.co.il</p>
                <p className="text-2xl font-semibold">47 / 100</p>
              </div>
            </div>
            <ul className="pt-4 space-y-2.5">
              {SAMPLE.map((s) => (
                <li key={s.text} className="flex items-start gap-2.5 text-sm">
                  {s.ok ? (
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-700" aria-label="OK" />
                  ) : (
                    <XIcon className="w-4 h-4 mt-0.5 shrink-0 text-red-700" aria-label="Problem" />
                  )}
                  <span className={s.ok ? 'text-muted' : 'text-ink'}>{s.text}</span>
                </li>
              ))}
            </ul>
            <figcaption className="pt-5 text-xs text-faint">Example of a domain email security result.</figcaption>
          </figure>
        </section>

        <section className="mt-20 grid gap-10 sm:grid-cols-3">
          {TOOL_GROUPS.map((g) => (
            <div key={g.name}>
              <h2 className="text-sm font-semibold text-ink pb-3 mb-3 border-b border-line">{g.name}</h2>
              <ul className="space-y-2">
                {g.tools.map(({ id, label, icon: Icon }) => (
                  <li key={id}>
                    <button onClick={onStart} className="flex items-center gap-2.5 text-sm text-ink-2 hover:text-brand transition-colors">
                      <Icon className="w-4 h-4 text-muted shrink-0" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>

      <footer className="px-5 sm:px-8 py-5 border-t border-line text-sm text-muted text-center">
        For security assessments with the owner’s permission and for internal awareness.
      </footer>
    </div>
  );
}
