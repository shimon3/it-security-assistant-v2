import { useState } from 'react';
import { MailSearch, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { analyzeHeaders, HeaderAnalysisResult } from '../utils/headerAnalyzer';
import { useLanguage } from '../i18n';

function severityColor(severity: number): string {
  if (severity >= 25) return 'text-red-700 bg-red-50 border-red-200';
  if (severity >= 15) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-brand bg-brand-soft border-brand/25';
}

function scoreColor(score: number): string {
  if (score >= 60) return 'text-red-700';
  if (score >= 30) return 'text-amber-700';
  return 'text-emerald-700';
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
  const { t } = useLanguage();
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
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<MailSearch className="w-5 h-5 text-brand" />}
        title={t('headerAnalyzerTitle')}
        description={t('headerAnalyzerDesc')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink-2">{t('rawEmailHeaders')}</label>
            <button
              onClick={() => setHeaders(EXAMPLE_HEADERS)}
              className="text-xs text-muted hover:text-brand transition-colors"
            >
              {t('loadExample')}
            </button>
          </div>
          <textarea
            value={headers}
            onChange={(e) => { setHeaders(e.target.value); if (result) setResult(null); }}
            placeholder={`Received: from mail.example.com...\nFrom: sender@example.com\nReply-To: other@suspicious.com\nAuthentication-Results: dkim=fail\n...`}
            rows={10}
            dir="ltr" className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink-2 placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-xs font-mono resize-none leading-relaxed"
          />
          <p className="text-xs text-faint">
            {t('headerHelp')}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!headers.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/30 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-all text-sm"
          >
            <MailSearch className="w-4 h-4" />
            {t('analyzeHeaders')}
          </button>
          {(result || headers) && (
            <button
              onClick={handleReset}
              className="px-5 py-3.5 border border-line hover:border-line-strong text-muted hover:text-ink rounded-xl transition-all text-sm font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in border-t border-line pt-6">
            {/* Score */}
            <div className="flex items-center justify-between bg-surface border border-line rounded-xl px-5 py-4">
              <div>
                <p className="text-sm text-muted">{t('suspicionScore')}</p>
                <p className={`text-3xl font-black mt-1 ${scoreColor(result.score)}`}>{result.score}<span className="text-lg font-normal text-faint">/100</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-2">
                  {result.score >= 60 ? t('riskHigh') : result.score >= 30 ? t('riskSuspicious') : t('riskLow')}
                </p>
                <p className="text-xs text-faint mt-1">
                  {result.detections.length} {result.detections.length === 1 ? 'issue' : 'issues'} found
                </p>
              </div>
            </div>

            {result.detections.length === 0 ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4">
                <AlertTriangle className="w-5 h-5 text-emerald-700 shrink-0" />
                <p className="text-emerald-700 font-semibold text-sm">{t('noSuspiciousHeaders')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink-2">{t('detections')}</p>
                {result.detections.map((d, i) => (
                  <div key={i} className={`rounded-xl border overflow-hidden`}>
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-start hover:bg-sunken transition-colors"
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${severityColor(d.severity)}`}>
                          {d.severity >= 25 ? t('severityHigh') : d.severity >= 15 ? t('severityMedium') : t('severityLow')}
                        </span>
                        <span className="text-sm font-mono text-ink-2 truncate">{d.header}</span>
                      </div>
                      {expanded === i
                        ? <ChevronUp className="w-4 h-4 text-muted shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-muted shrink-0" />}
                    </button>
                    {expanded === i && (
                      <div className="border-t border-line px-4 py-3 space-y-2">
                        <p className="text-sm text-ink-2">{d.reason}</p>
                        <p className="text-xs font-mono text-muted break-all bg-surface px-3 py-2 rounded-lg">{d.value}</p>
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
