import { useState } from 'react';
import { MailSearch, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { analyzeHeaders, HeaderAnalysisResult } from '../utils/headerAnalyzer';

function severityColor(severity: number): string {
  if (severity >= 25) return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (severity >= 15) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
}

function severityLabel(severity: number): string {
  if (severity >= 25) return 'High';
  if (severity >= 15) return 'Medium';
  return 'Low';
}

function scoreColor(score: number): string {
  if (score >= 60) return 'text-red-400';
  if (score >= 30) return 'text-amber-400';
  return 'text-emerald-400';
}

const EXAMPLE_HEADERS = `Received: from mail.suspicious-domain.ru (mail.suspicious-domain.ru [185.220.101.45])
From: PayPal Security <security@paypal.com>
Reply-To: support@evil-site.xyz
Return-Path: <bounce@phishing-mailer.com>
Authentication-Results: dkim=fail; spf=fail
Received-SPF: fail (domain of paypal.com does not designate 185.220.101.45 as permitted sender)
Message-ID: <12345@different-domain.net>
Subject: Urgent: Your account has been limited`;

export default function HeaderAnalyzerPage() {
  const [headers, setHeaders] = useState('');
  const [result, setResult] = useState<HeaderAnalysisResult | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  function handleAnalyze() {
    if (!headers.trim()) return;
    setResult(analyzeHeaders(headers));
    setExpanded(null);
  }

  function handleReset() {
    setHeaders('');
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageHeader
        icon={<MailSearch className="w-5 h-5 text-sky-400" />}
        title="Email Header Analyzer"
        description="Paste raw email headers to detect spoofing, SPF/DKIM failures, and routing anomalies"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Raw Email Headers</label>
            <button
              onClick={() => setHeaders(EXAMPLE_HEADERS)}
              className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
            >
              Load example
            </button>
          </div>
          <textarea
            value={headers}
            onChange={(e) => { setHeaders(e.target.value); if (result) setResult(null); }}
            placeholder={`Received: from mail.example.com...\nFrom: sender@example.com\nReply-To: other@suspicious.com\nAuthentication-Results: dkim=fail\n...`}
            rows={10}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 placeholder-slate-700 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-xs font-mono resize-none leading-relaxed"
          />
          <p className="text-xs text-slate-600">
            In Gmail: open email → ⋮ menu → "Show original". In Outlook: File → Properties → Internet headers.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!headers.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/30 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-all text-sm"
          >
            <MailSearch className="w-4 h-4" />
            Analyze Headers
          </button>
          {(result || headers) && (
            <button
              onClick={handleReset}
              className="px-5 py-3.5 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all text-sm font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in border-t border-slate-800 pt-6">
            {/* Score */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
              <div>
                <p className="text-sm text-slate-400">Suspicion Score</p>
                <p className={`text-3xl font-black mt-1 ${scoreColor(result.score)}`}>{result.score}<span className="text-lg font-normal text-slate-600">/100</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-300">
                  {result.score >= 60 ? 'High Risk' : result.score >= 30 ? 'Suspicious' : 'Low Risk'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {result.detections.length} {result.detections.length === 1 ? 'issue' : 'issues'} found
                </p>
              </div>
            </div>

            {result.detections.length === 0 ? (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-4">
                <AlertTriangle className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-emerald-400 font-semibold text-sm">No suspicious header patterns detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-300">Detections</p>
                {result.detections.map((d, i) => (
                  <div key={i} className={`rounded-xl border overflow-hidden`}>
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${severityColor(d.severity)}`}>
                          {severityLabel(d.severity)}
                        </span>
                        <span className="text-sm font-mono text-slate-300 truncate">{d.header}</span>
                      </div>
                      {expanded === i
                        ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                    </button>
                    {expanded === i && (
                      <div className="border-t border-slate-800 px-4 py-3 space-y-2">
                        <p className="text-sm text-slate-300">{d.reason}</p>
                        <p className="text-xs font-mono text-slate-500 break-all bg-slate-900 px-3 py-2 rounded-lg">{d.value}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
