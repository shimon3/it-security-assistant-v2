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
    icon: <XCircle className="w-5 h-5 text-red-700" />,
    label: 'Malicious',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  suspicious: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-700" />,
    label: 'Suspicious',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  clean: {
    icon: <CheckCircle className="w-5 h-5 text-emerald-700" />,
    label: 'Clean',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  unknown: {
    icon: <AlertTriangle className="w-5 h-5 text-muted" />,
    label: 'Unknown',
    color: 'text-muted',
    bg: 'bg-sunken',
    border: 'border-line-strong',
  },
  not_found: {
    icon: <AlertTriangle className="w-5 h-5 text-muted" />,
    label: 'Not Found',
    color: 'text-muted',
    bg: 'bg-sunken',
    border: 'border-line-strong',
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5 text-muted" />,
    label: 'Error',
    color: 'text-muted',
    bg: 'bg-sunken',
    border: 'border-line-strong',
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
            <p className="text-muted text-xs font-mono break-all mt-0.5">{label}</p>
          </div>
        </div>
        {total > 0 && (
          <div className="text-right shrink-0 ml-4">
            <p className={`text-2xl font-bold ${cfg.color}`}>
              {malicious + suspicious}
              <span className="text-muted text-base font-normal">/{total}</span>
            </p>
            <p className="text-xs text-muted">engines flagged</p>
          </div>
        )}
      </div>
      {children}
      {(status === 'unknown' || status === 'not_found' || status === 'error') && errorMessage && (
        <div className="mt-3 text-sm text-muted">{errorMessage}</div>
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
    <div className="bg-surface border border-line rounded-xl p-5">
      <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm mb-4">
        {headerIcon ?? <ShieldAlert className="w-4 h-4 text-muted" />}
        Engine Breakdown
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Malicious',  value: malicious,  color: 'text-red-700'     },
          { label: 'Suspicious', value: suspicious,  color: 'text-amber-700'  },
          { label: 'Harmless',   value: harmless,    color: 'text-emerald-700' },
          { label: 'Undetected', value: undetected,  color: 'text-muted'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-sunken rounded-lg p-3 text-center border border-line-strong">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
