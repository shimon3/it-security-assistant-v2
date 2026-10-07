import { Shield, X, Home, Briefcase, FileLock2 } from 'lucide-react';
import { isPersonalOnly, useAuditMode } from '../utils/auditMode';
import { TOOL_GROUPS, type Tool } from './toolGroups';
import { useLanguage } from '../i18n';
import LanguageSwitch from './LanguageSwitch';

export type { Tool } from './toolGroups';

interface SidebarProps {
  activeTool: Tool;
  onSelect: (tool: Tool) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onHome?: () => void;
}

const TOOL_KEY: Record<Tool, Parameters<ReturnType<typeof useLanguage>['t']>[0]> = {
  domainaudit: 'toolDomainAudit', httpheaders: 'toolHttpHeaders', email: 'toolEmail',
  headers: 'toolHeaders', hibp: 'toolHibp', password: 'toolPassword', report: 'toolReport',
  qr: 'toolQr', encoder: 'toolEncoder', url: 'toolUrl', hash: 'toolHash', ip: 'toolIp',
  domain: 'toolDomain', ssl: 'toolSsl', privacy: 'privacy',
};

const GROUP_KEY: Record<string, Parameters<ReturnType<typeof useLanguage>['t']>[0]> = {
  'Client audit': 'groupClientAudit',
  Utilities: 'groupUtilities',
  'Personal lookups': 'groupPersonal',
};

export default function Sidebar({ activeTool, onSelect, isOpen = false, onClose, onHome }: SidebarProps) {
  const [auditMode, setAuditMode] = useAuditMode();
  const { t, dir } = useLanguage();
  const groups = TOOL_GROUPS.map((g) => ({
    ...g,
    tools: auditMode ? g.tools.filter((tool) => !isPersonalOnly(tool.id)) : g.tools,
  })).filter((g) => g.tools.length > 0);

  const item = (id: Tool, Icon: React.ElementType) => {
    const active = activeTool === id;
    return (
      <button
        key={id}
        onClick={() => onSelect(id)}
        aria-current={active ? 'page' : undefined}
        className={`relative w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${dir === 'he' ? 'text-right' : 'text-left'} ${active ? 'bg-brand-soft text-brand-strong font-semibold' : 'text-ink-2 hover:bg-sunken'}`}
      >
        {active && <span className={`absolute top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand ${dir === 'he' ? 'right-0' : 'left-0'}`} aria-hidden="true" />}
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand' : 'text-muted'}`} />
        <span className="truncate">{t(TOOL_KEY[id])}</span>
      </button>
    );
  };

  return (
    <aside
      dir={dir}
      className={[
        'fixed md:sticky md:top-0 inset-y-0 z-50',
        dir === 'he' ? 'right-0' : 'left-0',
        'w-72 md:w-64 shrink-0 h-screen bg-surface flex flex-col',
        dir === 'he' ? 'border-l border-line' : 'border-r border-line',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : dir === 'he' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
    >
      <div className="px-5 h-16 shrink-0 border-b border-line flex items-center gap-2.5">
        <Shield className="w-5 h-5 text-brand shrink-0" strokeWidth={2} />
        <p className="flex-1 font-semibold text-ink text-[15px] tracking-tight">IT Security Assistant</p>
        <LanguageSwitch compact />
        {onClose && (
          <button onClick={onClose} className="md:hidden text-muted hover:text-ink transition-colors p-1" aria-label={t('closeMenu')}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5" aria-label="Tools">
        {groups.map((g) => (
          <div key={g.name} className="space-y-0.5">
            <p className="px-4 pb-1 text-xs font-medium text-muted">{t(GROUP_KEY[g.name])}</p>
            {g.tools.map((tool) => item(tool.id, tool.icon))}
          </div>
        ))}
        <div className="space-y-0.5 pt-3 border-t border-line">
          {item('privacy', FileLock2)}
          {onHome && (
            <button onClick={onHome} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-ink-2 hover:bg-sunken transition-colors">
              <Home className="w-4 h-4 shrink-0 text-muted" />
              {t('home')}
            </button>
          )}
        </div>
      </nav>

      <div className="p-3 shrink-0 border-t border-line">
        <label className={`flex items-start gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors ${auditMode ? 'border-amber-300 bg-amber-50' : 'border-line bg-canvas'}`}>
          <Briefcase className={`w-4 h-4 shrink-0 mt-0.5 ${auditMode ? 'text-amber-700' : 'text-muted'}`} />
          <span className="flex-1 min-w-0">
            <span className={`block text-sm font-semibold ${auditMode ? 'text-amber-800' : 'text-ink'}`}>
              {t('auditMode')} {auditMode ? t('auditOn') : t('auditOff')}
            </span>
            <span className="block text-xs text-muted leading-snug mt-0.5">{t('auditHint')}</span>
          </span>
          <input type="checkbox" className="mt-1 w-4 h-4 accent-amber-600" checked={auditMode} onChange={(e) => setAuditMode(e.target.checked)} aria-label={t('auditMode')} />
        </label>
      </div>
    </aside>
  );
}
