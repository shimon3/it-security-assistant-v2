import { useState, useEffect } from 'react';
import { Menu, Shield } from 'lucide-react';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import UrlScannerPage from './pages/UrlScannerPage';
import HashCheckerPage from './pages/HashCheckerPage';
import PasswordCheckerPage from './pages/PasswordCheckerPage';
import IpLookupPage from './pages/IpLookupPage';
import DomainWhoisPage from './pages/DomainWhoisPage';
import HibpPage from './pages/HibpPage';
import EncoderPage from './pages/EncoderPage';
import SslCheckerPage from './pages/SslCheckerPage';
import HeaderAnalyzerPage from './pages/HeaderAnalyzerPage';
import QrScannerPage from './pages/QrScannerPage';
import Sidebar, { Tool } from './components/Sidebar';

export default function App() {
  const [inApp, setInApp] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('email');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    function handleQrUrl(e: Event) {
      const url = (e as CustomEvent<string>).detail;
      setQrUrl(url);
      setActiveTool('url');
      setSidebarOpen(false);
    }
    window.addEventListener('qr-scan-url', handleQrUrl);
    return () => window.removeEventListener('qr-scan-url', handleQrUrl);
  }, []);

  if (!inApp) {
    return <HomePage onStart={() => setInApp(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeTool={activeTool}
        onSelect={(t) => { setActiveTool(t); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHome={() => { setInApp(false); setSidebarOpen(false); }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile sticky header */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Shield className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-slate-200">IT Security Assistant</span>
        </div>

        {activeTool === 'email'   && <AnalysisPage onBack={() => setInApp(false)} />}
        {activeTool === 'url'     && <UrlScannerPage initialUrl={qrUrl} onUrlConsumed={() => setQrUrl('')} />}
        {activeTool === 'hash'    && <HashCheckerPage />}
        {activeTool === 'password'&& <PasswordCheckerPage />}
        {activeTool === 'ip'      && <IpLookupPage />}
        {activeTool === 'domain'  && <DomainWhoisPage />}
        {activeTool === 'hibp'    && <HibpPage />}
        {activeTool === 'encoder' && <EncoderPage />}
        {activeTool === 'ssl'     && <SslCheckerPage />}
        {activeTool === 'headers' && <HeaderAnalyzerPage />}
        {activeTool === 'qr'      && <QrScannerPage />}
      </div>
    </div>
  );
}
