import { useState, useEffect } from 'react';
import { Menu, Shield, PlayCircle } from 'lucide-react';
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
import TokenPrompt from './components/TokenPrompt';
import { AUTH_REQUIRED_EVENT } from './utils/apiClient';
import { isAuditMode, isPersonalOnly, useAuditMode } from './utils/auditMode';
import PrivacyPage from './pages/PrivacyPage';
import DomainAuditPage from './pages/DomainAuditPage';
import HttpHeadersPage from './pages/HttpHeadersPage';
import { DEMO_DOMAIN, setDemoMode, useDemoMode } from './utils/demoMode';
import { clearSession, updateSession } from './utils/auditSession';

export default function App() {
  const [inApp, setInApp] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('domainaudit');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [askToken, setAskToken] = useState(false);
  const [auditMode] = useAuditMode();
  const demo = useDemoMode();

  function startDemo() {
    setDemoMode(true);
    updateSession({ domain: DEMO_DOMAIN, clientName: 'Example Shop Ltd', domainAudit: null, httpHeaders: null });
    setActiveTool('domainaudit');
    setInApp(true);
  }

  function exitDemo() {
    setDemoMode(false);
    clearSession();
  }

  // Leave a personal-only tool as soon as audit mode is switched on.
  useEffect(() => {
    if (auditMode && isPersonalOnly(activeTool)) setActiveTool('email');
  }, [auditMode, activeTool]);

  useEffect(() => {
    const onAuthRequired = () => setAskToken(true);
    window.addEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
  }, []);

  useEffect(() => {
    function handleQrUrl(e: Event) {
      if (isAuditMode()) return; // URL reputation uses VirusTotal: personal use only
      const url = (e as CustomEvent<string>).detail;
      setQrUrl(url);
      setActiveTool('url');
      setSidebarOpen(false);
    }
    window.addEventListener('qr-scan-url', handleQrUrl);
    return () => window.removeEventListener('qr-scan-url', handleQrUrl);
  }, []);

  if (!inApp) {
    return <HomePage onStart={() => setInApp(true)} onDemo={startDemo} />;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {askToken && <TokenPrompt onClose={() => setAskToken(false)} />}
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/30 z-40 md:hidden"
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
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-surface border-b border-line">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-ink transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Shield className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-ink">IT Security Assistant</span>
        </div>

        {demo && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 sm:px-8 py-2.5 bg-brand text-white text-sm" role="status">
            <PlayCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0">Demo: every result is made up for a fictional shop. Nothing is sent to the server.</span>
            <button onClick={exitDemo} className="font-semibold underline underline-offset-2 hover:no-underline">
              Exit demo
            </button>
          </div>
        )}

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
        {activeTool === 'privacy' && <PrivacyPage />}
        {activeTool === 'domainaudit' && <DomainAuditPage />}
        {activeTool === 'httpheaders' && <HttpHeadersPage />}
      </div>
    </div>
  );
}
