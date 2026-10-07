import { CheckCircle, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../i18n';

type UrlStatus = 'malicious' | 'suspicious' | 'clean' | 'unknown' | 'error';
type HashStatus = 'malicious' | 'suspicious' | 'clean' | 'not_found' | 'error';
type VTStatus = UrlStatus | HashStatus;

const STATUS_STYLE: Record<VTStatus, {
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}> = {
  malicious: { icon: <XCircle className="w-5 h-5 text-red-700" />, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  suspicious: { icon: <AlertTriangle className="w-5 h-5 text-amber-700" />, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  clean: { icon: <CheckCircle className="w-5 h-5 text-emerald-700" />, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  unknown: { icon: <AlertTriangle className="w-5 h-5 text-muted" />, color: 'text-muted', bg: 'bg-sunken', border: 'border-line-strong' },
  not_found: { icon: <AlertTriangle className="w-5 h-5 text-muted" />, color: 'text-muted', bg: 'bg-sunken', border: 'border-line-strong' },
  error: { icon: <AlertTriangle className="w-5 h-5 text-muted" />, color: 'text-muted', bg: 'bg-sunken', border: 'border-line-strong' },
};

interface VTVerdictCardProps {
  status: VTStatus;
  label: string;
  malicious: number;
  suspicious: number;
  total: number;
  errorMessage?: string;
  children?: React.ReactNode;
}

export function VTVerdictCard({ status, label, malicious, suspicious, total, errorMessage, children }: VTVerdictCardProps) {
  const { t } = useLanguage();
  const cfg = STATUS_STYLE[status];
  const statusLabel =
    status === 'malicious' ? t('malicious') :
    status === 'suspicious' ? t('suspicious') :
    status === 'clean' ? t('clean') :
    status === 'not_found' ? t('notFound') :
    status === 'error' ? t('errorLabel') : t('unknown');

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {cfg.icon}
          <div className="min-w-0">
            <p className={`font-bold text-lg ${cfg.color}`}>{statusLabel}</p>
            <p dir="ltr" className="text-muted text-xs font-mono break-all mt-0.5">{label}</p>
          </div>
        </div>
        {total > 0 && (
          <div className="text-end shrink-0 ms-4">
            <p className={`text-2xl font-bold ${cfg.color}`}>
              {malicious + suspicious}
              <span className="text-muted text-base font-normal">/{total}</span>
            </p>
            <p className="text-xs text-muted">{t('enginesFlagged')}</p>
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

interface VTEngineBreakdownProps {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  headerIcon?: React.ReactNode;
}

export function VTEngineBreakdown({ malicious, suspicious, harmless, undetected, headerIcon }: VTEngineBreakdownProps) {
  const { t } = useLanguage();
  const rows = [
    { label: t('malicious'), value: malicious, color: 'text-red-700' },
    { label: t('suspicious'), value: suspicious, color: 'text-amber-700' },
    { label: t('harmless'), value: harmless, color: 'text-emerald-700' },
    { label: t('undetected'), value: undetected, color: 'text-muted' },
  ];

  return (
    <div className="bg-surface border border-line rounded-xl p-5">
      <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm mb-4">
        {headerIcon ?? <ShieldAlert className="w-4 h-4 text-muted" />}
        {t('engineBreakdown')}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rows.map(({ label, value, color }) => (
          <div key={label} className="bg-sunken rounded-lg p-3 text-center border border-line-strong">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
