import { FileLock2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

interface Row {
  tool: string;
  sentTo: string;
  data: string;
  kept: string;
  audit: 'allowed' | 'hidden';
}

// Keep this table in sync with api/ and src/utils/. It doubles as the data annex of the client contract.
const ROWS: Row[] = [
  { tool: 'Email analysis', sentTo: 'Nowhere — runs in the browser', data: '—', kept: 'Last 5 analyses in this browser (personal mode only)', audit: 'allowed' },
  { tool: 'Email analysis → link scan', sentTo: 'VirusTotal (via /api/vt-scan-urls)', data: 'Up to 5 suspicious links', kept: 'VirusTotal keeps submitted URLs', audit: 'hidden' },
  { tool: 'Domain email security', sentTo: 'Cloudflare public DNS (via /api/domain-audit)', data: 'The domain name and its DNS sub-names (_dmarc, DKIM selectors…)', kept: 'Nothing on our side', audit: 'allowed' },
  { tool: 'Header analyzer', sentTo: 'Nowhere — runs in the browser', data: '—', kept: 'Nothing', audit: 'allowed' },
  { tool: 'Password strength', sentTo: 'Nowhere — runs in the browser', data: '—', kept: 'Nothing', audit: 'allowed' },
  { tool: 'Have I Been Pwned', sentTo: 'api.pwnedpasswords.com', data: 'First 5 characters of the password’s SHA-1 hash', kept: 'Nothing on our side', audit: 'allowed' },
  { tool: 'Encoder / Decoder', sentTo: 'Nowhere — runs in the browser', data: '—', kept: 'Nothing', audit: 'allowed' },
  { tool: 'QR code scanner', sentTo: 'Nowhere — camera and image stay in the browser', data: '—', kept: 'Nothing', audit: 'allowed' },
  { tool: 'URL scanner, hash checker, IP lookup, domain WHOIS', sentTo: 'VirusTotal (via /api/vt-*)', data: 'The URL, hash, IP or domain typed', kept: 'VirusTotal keeps submitted URLs', audit: 'hidden' },
  { tool: 'SSL/TLS checker', sentTo: 'Qualys SSL Labs (via /api/ssl-check)', data: 'The domain name', kept: 'SSL Labs may cache results', audit: 'hidden' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<FileLock2 className="w-5 h-5 text-brand" />}
        title="Data & Privacy"
        description="What each tool sends to third-party services, and what is kept"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 text-sm">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left">
            <thead className="bg-surface text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">Tool</th>
                <th className="px-4 py-3 font-semibold">Sent to</th>
                <th className="px-4 py-3 font-semibold">Data sent</th>
                <th className="px-4 py-3 font-semibold">Kept</th>
                <th className="px-4 py-3 font-semibold">Audit mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink-2">
              {ROWS.map((r) => (
                <tr key={r.tool}>
                  <td className="px-4 py-3 font-medium text-ink">{r.tool}</td>
                  <td className="px-4 py-3">{r.sentTo}</td>
                  <td className="px-4 py-3">{r.data}</td>
                  <td className="px-4 py-3">{r.kept}</td>
                  <td className={`px-4 py-3 ${r.audit === 'hidden' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {r.audit === 'hidden' ? 'Hidden (non-commercial API)' : 'Available'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-muted">
          <h2 className="text-base font-semibold text-ink">Server side</h2>
          <p>The app has no database. The /api routes keep nothing once they answer.</p>
          <p>
            The hosting provider (Vercel) logs each request with its IP address. Rate-limit counters are keyed by IP
            address and expire after one minute.
          </p>
          <p>The access token is kept in this browser tab only and is cleared when the tab closes.</p>
        </div>
      </div>
    </div>
  );
}
