import { Shield, ArrowRight, Mail, Globe, Hash, Lock, Search, ShieldAlert, Code2, ShieldCheck, MailSearch, QrCode } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
}

const tools = [
  { icon: Mail,        label: 'Email Analysis',        desc: 'Phishing detection',          isNew: false },
  { icon: Globe,       label: 'URL Scanner',            desc: 'URL reputation via VirusTotal', isNew: false },
  { icon: Hash,        label: 'Hash Checker',           desc: 'File malware lookup',         isNew: false },
  { icon: Lock,        label: 'Password Strength',      desc: 'Security evaluator',          isNew: false },
  { icon: Globe,       label: 'IP Lookup',              desc: 'IP reputation',               isNew: false },
  { icon: Search,      label: 'Domain WHOIS',           desc: 'Domain info & reputation',    isNew: false },
  { icon: ShieldAlert, label: 'Have I Been Pwned',      desc: 'Breach check',                isNew: false },
  { icon: Code2,       label: 'Encoder / Decoder',      desc: 'Base64, URL, Hex',           isNew: false },
  { icon: ShieldCheck, label: 'SSL/TLS Checker',        desc: 'Certificate grade & expiry',  isNew: true  },
  { icon: MailSearch,  label: 'Header Analyzer',        desc: 'SPF / DKIM / spoofing',       isNew: true  },
  { icon: QrCode,      label: 'QR Code Scanner',        desc: 'Decode & scan for threats',   isNew: true  },
];

export default function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <nav className="px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 border-b border-slate-800">
        <Shield className="w-6 h-6 text-sky-400 shrink-0" strokeWidth={1.5} />
        <span className="font-semibold text-slate-200 tracking-tight">IT Security Assistant</span>
      </nav>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-3xl w-full space-y-10">

          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium px-4 py-2 rounded-full">
              <Shield className="w-4 h-4" />
              All-in-one Security Toolkit
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                IT Security
                <span className="block text-sky-400">Assistant</span>
              </h1>
              <p className="text-base sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
                11 security tools in one dashboard. Analyze emails, scan URLs, check breaches, decode payloads and more.
              </p>
            </div>

            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-400/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Tools grid */}
          <div className="space-y-4">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider text-center">Available Tools</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tools.map(({ icon: Icon, label, desc, isNew }) => (
                <button
                  key={label}
                  onClick={onStart}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-4 text-left flex items-start gap-3 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-200 text-sm truncate">{label}</p>
                      {isNew && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="px-4 sm:px-6 py-5 border-t border-slate-800 text-center text-slate-600 text-sm">
        IT Security Assistant &mdash; For educational and internal security awareness use only
      </footer>
    </div>
  );
}
