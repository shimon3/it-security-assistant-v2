import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  FileText,
  Search,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Code2,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { analyzeEmail, AnalysisResult } from '../utils/emailAnalyzer';
import { analyzeHeaders, HeaderAnalysisResult } from '../utils/headerAnalyzer';
import { scanUrlsWithVT, VTUrlResult } from '../utils/virusTotalApi';
import { copyReportToClipboard } from '../utils/exportReport';
import RiskResults from '../components/RiskResults';
import HistoryPanel, { HistoryEntry } from '../components/HistoryPanel';

interface AnalysisPageProps {
  onBack: () => void;
}

const HISTORY_KEY = 'it_security_history';
const MAX_HISTORY = 5;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // localStorage quota exceeded — skip silently
  }
}

export default function AnalysisPage({ onBack }: AnalysisPageProps) {
  const [senderEmail, setSenderEmail] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [rawHeaders, setRawHeaders] = useState('');
  const [showHeaders, setShowHeaders] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [headerResult, setHeaderResult] = useState<HeaderAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [vtResults, setVtResults] = useState<VTUrlResult[] | null>(null);
  const [vtLoading, setVtLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function handleAnalyze() {
    if (!emailContent.trim()) {
      setError('Please paste the email content to analyze.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setHeaderResult(null);
    setVtResults(null);

    const analysis = analyzeEmail(senderEmail, emailContent);
    setResult(analysis);

    if (rawHeaders.trim()) {
      setHeaderResult(analyzeHeaders(rawHeaders));
    }

    setLoading(false);

    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      senderEmail,
      emailPreview: emailContent.trim().slice(0, 60),
      result: analysis,
      analyzedAt: Date.now(),
    };
    const updated = [newEntry, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveHistory(updated);

    const urlsToScan = analysis.suspiciousUrls.map((u) => u.url);
    if (urlsToScan.length > 0) {
      setVtLoading(true);
      scanUrlsWithVT(urlsToScan)
        .then((vtData) => setVtResults(vtData))
        .catch(() => setVtResults([]))
        .finally(() => setVtLoading(false));
    }
  }

  function handleReset() {
    setSenderEmail('');
    setEmailContent('');
    setRawHeaders('');
    setResult(null);
    setHeaderResult(null);
    setVtResults(null);
    setError('');
  }

  function handleLoadFromHistory(entry: HistoryEntry) {
    setSenderEmail(entry.senderEmail);
    setEmailContent('');
    setRawHeaders('');
    setResult(entry.result);
    setHeaderResult(null);
    setVtResults(null);
    setError('');
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleClearHistory() {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  async function handleCopyReport() {
    if (!result) return;
    await copyReportToClipboard(senderEmail, result, headerResult, vtResults);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <nav className="px-6 py-3 flex items-center border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="ml-auto flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all"
          >
            <Clock className="w-4 h-4" />
            History ({history.length})
          </button>
        )}
      </nav>

      <PageHeader
        icon={<Mail className="w-5 h-5 text-sky-400" />}
        title="Email Analysis"
        description="Paste the email details below to scan for threats"
      />

      <main className="flex-1 px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-8">
          {showHistory && (
            <HistoryPanel
              history={history}
              onLoad={handleLoadFromHistory}
              onClear={handleClearHistory}
              onClose={() => setShowHistory(false)}
            />
          )}

          <div className="space-y-5">
            {/* Sender */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                Sender Email Address
              </label>
              <input
                type="text"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="e.g. support@micr0soft.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
              />
            </div>

            {/* Email body */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <FileText className="w-4 h-4 text-slate-400" />
                Email Content
                <span className="text-red-400">*</span>
              </label>
              <textarea
                value={emailContent}
                onChange={(e) => {
                  setEmailContent(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Paste the full email content here..."
                rows={10}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm resize-none leading-relaxed"
              />
              {error && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                  {error}
                </p>
              )}
            </div>

            {/* Headers (collapsible) */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowHeaders(!showHeaders)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Email Headers
                  <span className="text-xs text-slate-600 font-normal">optional — paste raw headers for deeper analysis</span>
                </span>
                {showHeaders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showHeaders && (
                <div className="border-t border-slate-800 p-4">
                  <textarea
                    value={rawHeaders}
                    onChange={(e) => setRawHeaders(e.target.value)}
                    placeholder={`Received: from mail.example.com...\nFrom: sender@example.com\nReply-To: other@suspicious.com\nAuthentication-Results: dkim=fail\n...`}
                    rows={8}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-700 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-xs font-mono resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={loading || vtLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/20 hover:shadow-sky-400/25 hover:scale-[1.01] active:scale-[0.99] text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>

              {(result || senderEmail || emailContent) && (
                <button
                  onClick={handleReset}
                  className="px-5 py-3.5 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {result && (
            <div className="border-t border-slate-800 pt-8 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all"
                >
                  {copied ? (
                    <span className="text-emerald-400">✓ Copied!</span>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      Copy Report
                    </>
                  )}
                </button>
              </div>
              <RiskResults
                result={result}
                headerResult={headerResult}
                vtResults={vtResults}
                vtLoading={vtLoading}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
