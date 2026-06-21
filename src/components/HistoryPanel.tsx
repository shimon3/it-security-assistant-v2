import { Clock, X, Trash2, RotateCcw } from 'lucide-react';
import { AnalysisResult } from '../utils/emailAnalyzer';

export interface HistoryEntry {
  id: string;
  senderEmail: string;
  emailPreview: string;
  result: AnalysisResult;
  analyzedAt: number;
}

interface HistoryPanelProps {
  history: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onClear: () => void;
  onClose: () => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getLevelColor(level: string) {
  if (level === 'High') return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (level === 'Medium')
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
}

function getLevelDot(level: string) {
  if (level === 'High') return 'bg-red-400';
  if (level === 'Medium') return 'bg-amber-400';
  return 'bg-emerald-400';
}

export default function HistoryPanel({
  history,
  onLoad,
  onClear,
  onClose,
}: HistoryPanelProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold text-white">
            Recent Analyses
          </span>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {history.length}/5
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-800/50">
        {history.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onLoad(entry)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-800/50 transition-colors text-left group"
          >
            {/* Risk dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getLevelDot(
                entry.result.level
              )}`}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 truncate font-medium">
                {entry.senderEmail || 'No sender'}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {entry.emailPreview}
              </p>
            </div>

            {/* Score badge */}
            <div
              className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border ${getLevelColor(
                entry.result.level
              )}`}
            >
              {entry.result.score}
            </div>

            {/* Time + reload icon */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-slate-500">
                {timeAgo(entry.analyzedAt)}
              </p>
              <RotateCcw className="w-3 h-3 text-slate-600 group-hover:text-sky-400 transition-colors mt-1 ml-auto" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
