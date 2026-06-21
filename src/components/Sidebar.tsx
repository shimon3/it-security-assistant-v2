import { Mail, Globe, Hash, Lock, Shield } from 'lucide-react';

export type Tool = 'email' | 'url' | 'hash' | 'password';

interface SidebarProps {
  activeTool: Tool;
  onSelect: (tool: Tool) => void;
}

const tools: { id: Tool; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'email',    label: 'Email Analysis',    icon: Mail,   desc: 'Phishing detection'   },
  { id: 'url',      label: 'URL Scanner',        icon: Globe,  desc: 'URL reputation'       },
  { id: 'hash',     label: 'Hash Checker',       icon: Hash,   desc: 'File threat lookup'   },
  { id: 'password', label: 'Password Strength',  icon: Lock,   desc: 'Security evaluator'   },
];

export default function Sidebar({ activeTool, onSelect }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
        <Shield className="w-5 h-5 text-sky-400 shrink-0" strokeWidth={1.5} />
        <div className="min-w-0">
          <p className="font-bold text-white text-sm tracking-tight leading-tight">IT Security</p>
          <p className="text-xs text-slate-500 leading-tight">Assistant</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider px-2 mb-3">Tools</p>
        {tools.map(({ id, label, icon: Icon, desc }) => {
          const active = activeTool === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group border ${
                active
                  ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${active ? 'text-sky-400' : ''}`}>{label}</p>
                <p className="text-xs text-slate-600 truncate">{desc}</p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-700 text-center leading-relaxed">For security awareness use only</p>
      </div>
    </aside>
  );
}
