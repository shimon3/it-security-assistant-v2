import { useState } from 'react';
import { validClientName, type V3Client } from './clientModels';

interface Props {
  clients: V3Client[];
  isLoading: boolean;
  onCreate: (name: string, domain: string) => Promise<void>;
  onSelect: (client: V3Client) => void;
}

/** UI is not mounted until Supabase Auth + tenant-scoped repository are integrated. */
export default function ClientsPanel({ clients, isLoading, onCreate, onSelect }: Props) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validClientName(name) || saving) return;
    setError('');
    setSaving(true);
    try {
      await onCreate(name.trim(), domain.trim());
      setName('');
      setDomain('');
    } catch {
      setError('Unable to create client. Check your access and try again.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="rounded-xl border border-line bg-surface p-5 space-y-4">
      <h2 className="text-lg font-semibold">My business clients</h2>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-sm">Company name
          <input aria-label="Company name" className="w-full border border-line rounded-lg p-2" value={name} onChange={e=>setName(e.target.value)} maxLength={160} required />
        </label>
        <label className="text-sm">Domain (optional)
          <input aria-label="Company domain" className="w-full border border-line rounded-lg p-2" value={domain} onChange={e=>setDomain(e.target.value)} maxLength={255} />
        </label>
        <button className="rounded-lg bg-brand text-white px-4 py-2 disabled:opacity-50" disabled={!validClientName(name)||saving}>{saving?'Saving…':'Add client'}</button>
      </form>
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      {isLoading ? <p>Loading clients…</p> : clients.length===0 ? <p>No clients yet.</p> : (
        <ul className="divide-y divide-line">{clients.map(client=>(
          <li key={client.id} className="py-3 flex items-center justify-between gap-3">
            <div><p className="font-medium">{client.name}</p><p className="text-xs text-muted">{client.domain || 'No domain'}</p></div>
            <button className="rounded-lg border border-line px-3 py-2" onClick={()=>onSelect(client)}>Open</button>
          </li>
        ))}</ul>
      )}
    </section>
  );
}
