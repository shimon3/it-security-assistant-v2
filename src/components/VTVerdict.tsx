import { CheckCircle, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

type UrlStatus = 'malicious' | 'suspicious' | 'clean' | 'unknown' | 'error';
type HashStatus = 'malicious' | 'suspicious' | 'clean' | 'not_found' | 'error';
type VTStatus = UrlStatus | HashStatus;

const STATUS_CONFIG: Record<VTStatus, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  border: string;
}> = {
  malicious: {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    label: 'Malicious',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  suspicious: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    label: 'Suspicious',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  clean: {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    label: 'Clean',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  unknown: {
    icon: <AlertTriangle className="w-5 h-5 text-slate-400" />,
    label: 'Unknown',
    color: 'text-slate-400',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
  },
  not_found: {
    icon: <AlertTriangle className="w-5 h-5 text-slate-400" />,
    label: 'Not Found',
    color: 'text-slate-400',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5 text-slate-400" />,
    label: 'Error',
    color: 'text-slate-400',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
  },
};

// ---

interface VTVerdictCardProps {
  status: VTStatus;
  label: string;
  malicious: number;
  suspicious: number;
  total: number;
  errorMessage?: string;
  children?: React.ReactNode;
}

export function VTVerdictCard({
  status,
  label,
  malicious,
  suspicious,
  total,
  errorMessage,
  children,
}: VTVerdictCardProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {cfg.icon}
          <div>
            <p className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</p>
            <p className="text-slate-500 text-xs font-mono break-all mt-0.5">{label}</p>
          </div>
        </div>
        {total > 0 && (
          <div className="text-right shrink-0 ml-4">
            <p className={`text-2xl font-bold ${cfg.color}`}>
              {malicious + suspicious}
              <span className="text-slate-500 text-base font-normal">/{total}</span>
            </p>
            <p className="text-xs text-slate-500">engines flagged</p>
          </div>
        )}
      </div>
      {children}
      {(status === 'unknown' || status === 'not_found' || status === 'error') && errorMessage && (
        <div className="mt-3 text-sm text-slate-400">{errorMessage}</div>
      )}
    </div>
  );
}

// ---

interface VTEngineBreakdownProps {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  headerIcon?: React.ReactNode;
}

export function VTEngineBreakdown({
  malicious,
  suspicious,
  harmless,
  undetected,
  headerIcon,
}: VTEngineBreakdownProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm mb-4">
        {headerIcon ?? <ShieldAlert className="w-4 h-4 text-slate-400" />}
        Engine Breakdown
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Malicious',  value: malicious,  color: 'text-red-400'     },
          { label: 'Suspicious', value: suspicious,  color: 'text-amber-400'  },
          { label: 'Harmless',   value: harmless,    color: 'text-emerald-400' },
          { label: 'Undetected', value: undetected,  color: 'text-slate-400'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
