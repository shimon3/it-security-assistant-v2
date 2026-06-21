import { AlertTriangle, AlertCircle, CheckCircle, XCircle, ShieldCheck, Lightbulb, Link2, Paperclip, Loader2, ShieldAlert, Code2 } from 'lucide-react';
import { AnalysisResult } from '../utils/emailAnalyzer';
import { HeaderAnalysisResult } from '../utils/headerAnalyzer';
import { VTUrlResult } from '../utils/virusTotalApi';

interface RiskResultsProps {
  result: AnalysisResult;
  headerResult?: HeaderAnalysisResult | null;
  vtResults?: VTUrlResult[] | null;
  vtLoading?: boolean;
}

const levelConfig = {
  Low: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    bar: 'bg-emerald-500',
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    label: 'Low Risk',
  },
  Medium: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    bar: 'bg-amber-500',
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    label: 'Medium Risk',
  },
  High: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    bar: 'bg-red-500',
    icon: <AlertCircle className="w-5 h-5 text-red-400" />,
    label: 'High Risk',
  },
};

export default function RiskResults({ result, headerResult, vtResults, vtLoading }: RiskResultsProps) {
  const config = levelConfig[result.level];
  const hasIssues = result.issues[0] !== 'No specific threats detected';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Score */}
      <div className={`rounded-xl border ${config.border} ${config.bg} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {config.icon}
            <span className={`font-bold text-lg ${config.color}`}>{config.label}</span>
          </div>
          <span className={`text-3xl font-bold ${config.color}`}>{result.score}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
            style={{ width: `${result.score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0</span>
          <span>Risk Score</span>
          <span>100</span>
        </div>
      </div>

      {/* Detected Issues */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          Detected Issues
        </div>
        <ul className="space-y-2">
          {result.issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {hasIssues ? (
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              )}
              <span className={hasIssues ? 'text-slate-300' : 'text-slate-400'}>{issue}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Suspicious Attachments */}
      {result.suspiciousAttachments && result.suspiciousAttachments.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <Paperclip className="w-4 h-4 text-red-400" />
            Suspicious Attachments
          </div>
          <ul className="space-y-3">
            {result.suspiciousAttachments.map((att, i) => (
              <li key={i} className="bg-slate-800/50 rounded-lg p-3 space-y-1.5 border border-slate-700">
                <div className="text-xs font-mono text-red-300 break-all bg-slate-900 px-2 py-1.5 rounded border border-slate-600">
                  📎 {att.name}
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-400">{att.reason}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suspicious URLs */}
      {result.suspiciousUrls.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <Link2 className="w-4 h-4 text-orange-400" />
            Suspicious URLs
          </div>
          <ul className="space-y-3">
            {result.suspiciousUrls.map((urlDetection, i) => (
              <li key={i} className="bg-slate-800/50 rounded-lg p-3 space-y-1.5 border border-slate-700">
                <div className="text-xs font-mono text-orange-300 break-all bg-slate-900 px-2 py-1.5 rounded border border-slate-600">
                  {urlDetection.url}
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-400">{urlDetection.reason}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Header Analysis */}
      {headerResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <Code2 className="w-4 h-4 text-indigo-400" />
              Header Analysis
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
              headerResult.score >= 40
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : headerResult.score >= 15
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            }`}>
              Score {headerResult.score}/100
            </span>
          </div>

          {headerResult.detections.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              No suspicious header patterns detected
            </div>
          ) : (
            <ul className="space-y-3">
              {headerResult.detections.map((d, i) => (
                <li key={i} className="bg-slate-800/50 rounded-lg p-3 space-y-1.5 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-indigo-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-600">
                      {d.header}
                    </span>
                    <span className={`text-xs font-medium ${
                      d.severity >= 25 ? 'text-red-400' : d.severity >= 15 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      +{d.severity} pts
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-300">{d.reason}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 truncate bg-slate-900/50 px-2 py-1 rounded">
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4 text-violet-400" />
            VirusTotal Scan
            {vtLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400 ml-1" />}
          </div>

          {vtLoading && !vtResults && (
            <p className="text-slate-500 text-sm">Scanning URLs with VirusTotal...</p>
          )}

          {vtResults && (
            <ul className="space-y-3">
              {vtResults.map((vt, i) => {
                const isClean = vt.status === 'clean';
                const isMalicious = vt.status === 'malicious';

                return (
                  <li key={i} className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700">
                    <div className="text-xs font-mono text-violet-300 break-all bg-slate-900 px-2 py-1.5 rounded border border-slate-600">
                      {vt.url}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isMalicious ? (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        ) : isClean ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${isMalicious ? 'text-red-400' : isClean ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {vt.status === 'error' || vt.status === 'unknown'
                            ? vt.errorMessage ?? 'Unknown'
                            : isMalicious
                            ? `Malicious — ${vt.malicious} engine(s) flagged`
                            : vt.suspicious > 0
                            ? `Suspicious — ${vt.suspicious} engine(s) flagged`
                            : 'Clean'}
                        </span>
                      </div>
                      {vt.total > 0 && (
                        <span className="text-xs text-slate-500 shrink-0">
                          {vt.malicious + vt.suspicious}/{vt.total} engines
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

      {/* Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <AlertCircle className="w-4 h-4 text-slate-400" />
          Explanation
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{result.explanation}</p>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <Lightbulb className="w-4 h-4 text-sky-400" />
          Recommendations
        </div>
        <ul className="space-y-2">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                {i + 1}
              </span>
              <span className="text-slate-400">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}