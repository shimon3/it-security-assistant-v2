import { useState } from 'react';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import UrlScannerPage from './pages/UrlScannerPage';
import HashCheckerPage from './pages/HashCheckerPage';
import PasswordCheckerPage from './pages/PasswordCheckerPage';
import IpLookupPage from './pages/IpLookupPage';
import DomainWhoisPage from './pages/DomainWhoisPage';
import HibpPage from './pages/HibpPage';
import EncoderPage from './pages/EncoderPage';
import Sidebar, { Tool } from './components/Sidebar';

export default function App() {
  const [inApp, setInApp] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('email');

  if (!inApp) {
    return <HomePage onStart={() => setInApp(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar activeTool={activeTool} onSelect={setActiveTool} />
      <div className="flex-1 min-w-0">
        {activeTool === 'email'    && <AnalysisPage onBack={() => setInApp(false)} />}
        {activeTool === 'url'      && <UrlScannerPage />}
        {activeTool === 'hash'     && <HashCheckerPage />}
        {activeTool === 'password' && <PasswordCheckerPage />}
        {activeTool === 'ip'       && <IpLookupPage />}
        {activeTool === 'domain'   && <DomainWhoisPage />}
        {activeTool === 'hibp'     && <HibpPage />}
        {activeTool === 'encoder'  && <EncoderPage />}
      </div>
    </div>
  );
}
