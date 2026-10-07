import { Mail, Globe, Hash, Lock, Shield, Search, ShieldAlert, Code2, X, Home, ShieldCheck, MailSearch, QrCode, Briefcase, FileLock2 } from 'lucide-react';
import { isPersonalOnly, useAuditMode } from '../utils/auditMode';

export type Tool = 'email' | 'url' | 'hash' | 'password' | 'ip' | 'domain' | 'hibp' | 'encoder' | 'ssl' | 'headers' | 'qr' | 'privacy';

interface SidebarProps {
  activeTool: Tool;
  onSelect: (tool: Tool) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onHome?: () => void;
}

const tools: { id: Tool; label: string; icon: React.ElementType; desc: string; isNew?: boolean }[] = [
  { id: 'email',    label: 'Email Analysis',      icon: Mail,        desc: 'Phishing detection'       },
  { id: 'url',      label: 'URL Scanner',          icon: Globe,       desc: 'URL reputation'           },
  { id: 'hash',     label: 'Hash Checker',         icon: Hash,        desc: 'File threat lookup'       },
  { id: 'password', label: 'Password Strength',    icon: Lock,        desc: 'Security evaluator'       },
  { id: 'ip',       label: 'IP Lookup',            icon: Globe,       desc: 'IP reputation'            },
  { id: 'domain',   label: 'Domain WHOIS',         icon: Search,      desc: 'Domain info'              },
  { id: 'hibp',     label: 'Have I Been Pwned',    icon: ShieldAlert, desc: 'Breach check'             },
  { id: 'encoder',  label: 'Encoder / Decoder',    icon: Code2,       desc: 'Base64, URL, Hex'        },
  { id: 'ssl',      label: 'SSL/TLS Checker',      icon: ShieldCheck, desc: 'Cert grade & expiry',     isNew: true },
  { id: 'headers',  label: 'Header Analyzer',      icon: MailSearch,  desc: 'SPF / DKIM / spoofing',   isNew: true },
  { id: 'qr',       label: 'QR Code Scanner',      icon: QrCode,      desc: 'Decode & scan',           isNew: true },
  { id: 'privacy',  label: 'Data & Privacy',       icon: FileLock2,   desc: 'What leaves this app'    },
];

export default function Sidebar({ activeTool, onSelect, isOpen = false, onClose, onHome }: SidebarProps) {
  const [auditMode, setAuditMode] = useAuditMode();
  const visibleTools = auditMode ? tools.filter((t) => !isPersonalOnly(t.id)) : tools;

  return (
    <aside
      className={[
        'fixed md:static inset-y-0 left-0 z-50',
        'w-64 md:w-56 shrink-0 min-h-screen',
        'bg-slate-900 border-r border-slate-800 flex flex-col',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
        <Shield className="w-5 h-5 text-sky-400 shrink-0" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm tracking-tight leading-tight">IT Security</p>
          <p className="text-xs text-slate-500 leading-tight">Assistant</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1 -mr-1"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tools nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider px-2 mb-3">Tools</p>
        {visibleTools.map(({ id, label, icon: Icon, desc, isNew }) => {
          const active = activeTool === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all border ${
                active
                  ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-medium truncate ${active ? 'text-sky-400' : ''}`}>{label}</p>
                  {isNew && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0 rounded shrink-0 leading-tight">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 truncate">{desc}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Home button */}
      {onHome && (
        <div className="px-3 pb-2">
          <button
            onClick={onHome}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </div>
      )}

      {/* Audit mode switch */}
      <div className="px-3 pb-3">
        <label className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer">
          <Briefcase className={`w-4 h-4 shrink-0 mt-0.5 ${auditMode ? 'text-amber-400' : 'text-slate-500'}`} />
          <span className="flex-1 min-w-0">
            <span className={`block text-sm font-medium ${auditMode ? 'text-amber-300' : 'text-slate-300'}`}>Audit mode</span>
            <span className="block text-xs text-slate-500 leading-snug">
              Client work: hides non-commercial APIs, no email history.
            </span>
          </span>
          <input
            type="checkbox"
            className="mt-1 accent-amber-400"
            checked={auditMode}
            onChange={(e) => setAuditMode(e.target.checked)}
            aria-label="Audit mode"
          />
        </label>
      </div>

      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-700 text-center leading-relaxed">For security awareness use only</p>
      </div>
    </aside>
  );
}
