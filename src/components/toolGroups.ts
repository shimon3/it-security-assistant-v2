import { Mail, Globe, Hash, Lock, Search, ShieldAlert, Code2, ShieldCheck, MailSearch, QrCode, MailCheck, Layers, FileText } from 'lucide-react';

export type Tool =
  | 'email' | 'url' | 'hash' | 'password' | 'ip' | 'domain' | 'hibp' | 'encoder' | 'ssl' | 'headers' | 'qr'
  | 'privacy' | 'domainaudit' | 'httpheaders' | 'report';

interface ToolItem {
  id: Tool;
  label: string;
  icon: React.ElementType;
}

// Grouped by what the tool is for. "Personal lookups" rely on non-commercial APIs
// and disappear in audit mode (see src/utils/auditMode.ts).
export const TOOL_GROUPS: { name: string; tools: ToolItem[] }[] = [
  {
    name: 'Client audit',
    tools: [
      { id: 'domainaudit', label: 'Domain email security', icon: MailCheck },
      { id: 'httpheaders', label: 'Website security headers', icon: Layers },
      { id: 'email', label: 'Email analysis', icon: Mail },
      { id: 'headers', label: 'Email header analyzer', icon: MailSearch },
      { id: 'hibp', label: 'Breached passwords', icon: ShieldAlert },
      { id: 'password', label: 'Password strength', icon: Lock },
      { id: 'report', label: 'Client report (Hebrew)', icon: FileText },
    ],
  },
  {
    name: 'Utilities',
    tools: [
      { id: 'qr', label: 'QR code scanner', icon: QrCode },
      { id: 'encoder', label: 'Encoder / decoder', icon: Code2 },
    ],
  },
  {
    name: 'Personal lookups',
    tools: [
      { id: 'url', label: 'URL reputation', icon: Globe },
      { id: 'hash', label: 'File hash lookup', icon: Hash },
      { id: 'ip', label: 'IP reputation', icon: Globe },
      { id: 'domain', label: 'Domain WHOIS', icon: Search },
      { id: 'ssl', label: 'SSL/TLS grade', icon: ShieldCheck },
    ],
  },
];
