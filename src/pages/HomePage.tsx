import { Shield, ArrowRight, Mail, AlertTriangle, CheckCircle } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
}

export default function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <nav className="px-6 py-5 flex items-center gap-3 border-b border-slate-800">
        <Shield className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
        <span className="font-semibold text-slate-200 tracking-tight">IT Security Assistant</span>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium px-4 py-2 rounded-full">
            <Shield className="w-4 h-4" />
            Email Threat Detection
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
              IT Security
              <span className="block text-sky-400">Assistant</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
              Analyze suspicious emails in seconds. Detect phishing attempts, fake domains, and malicious patterns instantly.
            </p>
          </div>

          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-400/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Analysis
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <FeatureCard
              icon={<Mail className="w-5 h-5 text-sky-400" />}
              title="Email Analysis"
              description="Paste any email content for instant threat detection"
            />
            <FeatureCard
              icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
              title="Risk Scoring"
              description="Get a clear 0–100 risk score with detailed breakdown"
            />
            <FeatureCard
              icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
              title="Actionable Advice"
              description="Receive specific recommendations based on findings"
            />
          </div>
        </div>
      </main>

      <footer className="px-6 py-5 border-t border-slate-800 text-center text-slate-600 text-sm">
        IT Security Assistant &mdash; For educational and internal security awareness use only
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left space-y-3 hover:border-slate-700 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-200 text-sm">{title}</p>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
