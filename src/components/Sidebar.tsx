import { Shield, X, Home, Briefcase, FileLock2 } from 'lucide-react';
import { isPersonalOnly, useAuditMode } from '../utils/auditMode';
import { TOOL_GROUPS, type Tool } from './toolGroups';

export type { Tool } from './toolGroups';

interface SidebarProps {
  activeTool: Tool;
  onSelect: (tool: Tool) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onHome?: () => void;
}

export default function Sidebar({ activeTool, onSelect, isOpen = false, onClose, onHome }: SidebarProps) {
  const [auditMode, setAuditMode] = useAuditMode();
  const groups = TOOL_GROUPS.map((g) => ({
    ...g,
    tools: auditMode ? g.tools.filter((t) => !isPersonalOnly(t.id)) : g.tools,
  })).filter((g) => g.tools.length > 0);

  const item = (id: Tool, label: string, Icon: React.ElementType) => {
    const active = activeTool === id;
    return (
      <button
        key={id}
        onClick={() => onSelect(id)}
        aria-current={active ? 'page' : undefined}
        className={`relative w-full flex items-center gap-3 pl-4 pr-3 py-1.5 rounded-md text-left text-sm transition-colors ${
          active ? 'bg-brand-soft text-brand-strong font-semibold' : 'text-ink-2 hover:bg-sunken'
        }`}
      >
        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand" aria-hidden="true" />}
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand' : 'text-muted'}`} />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <aside
      className={[
        'fixed md:sticky md:top-0 inset-y-0 left-0 z-50',
        'w-72 md:w-64 shrink-0 h-screen',
        'bg-surface border-r border-line flex flex-col',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
    >
      <div className="px-5 h-16 shrink-0 border-b border-line flex items-center gap-2.5">
        <Shield className="w-5 h-5 text-brand shrink-0" strokeWidth={2} />
        <p className="flex-1 font-semibold text-ink text-[15px] tracking-tight">IT Security Assistant</p>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-muted hover:text-ink transition-colors p-1 -mr-1" aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5" aria-label="Tools">
        {groups.map((g) => (
          <div key={g.name} className="space-y-0.5">
            <p className="px-4 pb-1 text-xs font-medium text-muted">{g.name}</p>
            {g.tools.map((t) => item(t.id, t.label, t.icon))}
          </div>
        ))}
        <div className="space-y-0.5 pt-3 border-t border-line">
          {item('privacy', 'Data & privacy', FileLock2)}
          {onHome && (
            <button
              onClick={onHome}
              className="w-full flex items-center gap-3 pl-4 pr-3 py-1.5 rounded-md text-left text-sm text-ink-2 hover:bg-sunken transition-colors"
            >
              <Home className="w-4 h-4 shrink-0 text-muted" />
              Home
            </button>
          )}
        </div>
      </nav>

      <div className="p-3 shrink-0 border-t border-line">
        <label
          className={`flex items-start gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors ${
            auditMode ? 'border-amber-300 bg-amber-50' : 'border-line bg-canvas'
          }`}
        >
          <Briefcase className={`w-4 h-4 shrink-0 mt-0.5 ${auditMode ? 'text-amber-700' : 'text-muted'}`} />
          <span className="flex-1 min-w-0">
            <span className={`block text-sm font-semibold ${auditMode ? 'text-amber-800' : 'text-ink'}`}>
              Audit mode {auditMode ? 'on' : 'off'}
            </span>
            <span className="block text-xs text-muted leading-snug mt-0.5">
              For client work: hides non-commercial lookups, keeps no email history.
            </span>
          </span>
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 accent-amber-600"
            checked={auditMode}
            onChange={(e) => setAuditMode(e.target.checked)}
            aria-label="Audit mode"
          />
        </label>
      </div>
    </aside>
  );
}
