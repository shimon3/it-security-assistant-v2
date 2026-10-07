import { AlertTriangle, AlertCircle, CheckCircle, XCircle, ShieldCheck, Lightbulb, Link2, Paperclip, Loader2, ShieldAlert, Code2 } from 'lucide-react';
import { AnalysisResult } from '../utils/emailAnalyzer';
import { HeaderAnalysisResult } from '../utils/headerAnalyzer';
import { VTUrlResult } from '../utils/virusTotalApi';
import { useLanguage } from '../i18n';

interface RiskResultsProps {
  result: AnalysisResult;
  headerResult?: HeaderAnalysisResult | null;
  vtResults?: VTUrlResult[] | null;
  vtLoading?: boolean;
}

const levelConfig = {
  Low: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    icon: <CheckCircle className="w-5 h-5 text-emerald-700" />,
    label: 'Low Risk',
  },
  Medium: {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    icon: <AlertTriangle className="w-5 h-5 text-amber-700" />,
    label: 'Medium Risk',
  },
  High: {
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
    icon: <AlertCircle className="w-5 h-5 text-red-700" />,
    label: 'High Risk',
  },
};

export default function RiskResults({ result, headerResult, vtResults, vtLoading }: RiskResultsProps) {
  const { t } = useLanguage();
  const config = levelConfig[result.level];
  const hasIssues = result.issues[0] !== 'No specific threats detected';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Score */}
      <div className={`rounded-xl border ${config.border} ${config.bg} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {config.icon}
            <span className={`font-bold text-lg ${config.color}`}>{result.level === 'Low' ? t('lowRisk') : result.level === 'Medium' ? t('mediumRisk') : t('highRisk')}</span>
          </div>
          <span className={`text-3xl font-bold ${config.color}`}>{result.score}</span>
        </div>
        <div className="h-2 bg-sunken rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
            style={{ width: `${result.score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>0</span>
          <span>{t('riskScore')}</span>
          <span>100</span>
        </div>
      </div>

      {/* {t('detectedIssues')} */}
      <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-muted" />
          Detected Issues
        </div>
        <ul className="space-y-2">
          {result.issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {hasIssues ? (
                <XCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              )}
              <span className={hasIssues ? 'text-ink-2' : 'text-muted'}>{issue}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* {t('suspiciousAttachments')} */}
      {result.suspiciousAttachments && result.suspiciousAttachments.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm">
            <Paperclip className="w-4 h-4 text-red-700" />
            Suspicious Attachments
          </div>
          <ul className="space-y-3">
            {result.suspiciousAttachments.map((att, i) => (
              <li key={i} className="bg-sunken rounded-lg p-3 space-y-1.5 border border-line-strong">
                <div className="text-xs font-mono text-red-700 break-all bg-surface px-2 py-1.5 rounded border border-line-strong">
                  📎 {att.name}
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted">{att.reason}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* {t('suspiciousUrls')} */}
      {result.suspiciousUrls.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm">
            <Link2 className="w-4 h-4 text-orange-700" />
            Suspicious URLs
          </div>
          <ul className="space-y-3">
            {result.suspiciousUrls.map((urlDetection, i) => (
              <li key={i} className="bg-sunken rounded-lg p-3 space-y-1.5 border border-line-strong">
                <div className="text-xs font-mono text-orange-700 break-all bg-surface px-2 py-1.5 rounded border border-line-strong">
                  {urlDetection.url}
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-orange-700 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted">{urlDetection.reason}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* {t('headerAnalysis')} */}
      {headerResult && (
        <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm">
              <Code2 className="w-4 h-4 text-indigo-700" />
              Header Analysis
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
              headerResult.score >= 40
                ? 'text-red-700 bg-red-50 border-red-200'
                : headerResult.score >= 15
                ? 'text-amber-700 bg-amber-50 border-amber-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              Score {headerResult.score}/100
            </span>
          </div>

          {headerResult.detections.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {t('noSuspiciousHeaders')}
            </div>
          ) : (
            <ul className="space-y-3">
              {headerResult.detections.map((d, i) => (
                <li key={i} className="bg-sunken rounded-lg p-3 space-y-1.5 border border-line-strong">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-indigo-700 bg-surface px-2 py-0.5 rounded border border-line-strong">
                      {d.header}
                    </span>
                    <span className={`text-xs font-medium ${
                      d.severity >= 25 ? 'text-red-700' : d.severity >= 15 ? 'text-amber-700' : 'text-muted'
                    }`}>
                      +{d.severity} pts
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
                    <span className="text-sm text-ink-2">{d.reason}</span>
                  </div>
                  <div className="text-xs font-mono text-muted truncate bg-sunken px-2 py-1 rounded">
                    {d.value.slice(0, 120)}{d.value.length > 120 ? '…' : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* VirusTotal Results */}
      {(vtLoading || vtResults) && (
        <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4 text-violet-700" />
            {t('vtScan')}
            {vtLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-700 ml-1" />}
          </div>

          {vtLoading && !vtResults && (
            <p className="text-muted text-sm">{t('scanningUrls')}</p>
          )}

          {vtResults && (
            <ul className="space-y-3">
              {vtResults.map((vt, i) => {
                const isClean = vt.status === 'clean';
                const isMalicious = vt.status === 'malicious';

                return (
                  <li key={i} className="bg-sunken rounded-lg p-3 space-y-2 border border-line-strong">
                    <div className="text-xs font-mono text-violet-700 break-all bg-surface px-2 py-1.5 rounded border border-line-strong">
                      {vt.url}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isMalicious ? (
                          <XCircle className="w-4 h-4 text-red-700 shrink-0" />
                        ) : isClean ? (
                          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${isMalicious ? 'text-red-700' : isClean ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {vt.status === 'error' || vt.status === 'unknown'
                            ? vt.errorMessage ?? t('unknown')
                            : isMalicious
                            ? `${t('malicious')} — ${vt.malicious} ${t('engines')}`
                            : vt.suspicious > 0
                            ? `${t('suspicious')} — ${vt.suspicious} ${t('engines')}`
                            : t('clean')}
                        </span>
                      </div>
                      {vt.total > 0 && (
                        <span className="text-xs text-muted shrink-0">
                          {vt.malicious + vt.suspicious}/{vt.total} {t('engines')}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* {t('explanation')} */}
      <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm">
          <AlertCircle className="w-4 h-4 text-muted" />
          Explanation
        </div>
        <p className="text-muted text-sm leading-relaxed">{result.explanation}</p>
      </div>

      {/* {t('recommendations')} */}
      <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-ink-2 font-semibold text-sm">
          <Lightbulb className="w-4 h-4 text-brand" />
          Recommendations
        </div>
        <ul className="space-y-2">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-brand-soft border border-brand/25 text-brand text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                {i + 1}
              </span>
              <span className="text-muted">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}