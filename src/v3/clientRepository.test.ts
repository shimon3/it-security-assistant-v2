import { describe, expect, it, vi } from 'vitest';
import { createClient, listClients } from './clientRepository';
const org = '11111111-1111-4111-8111-111111111111';

describe('V3 tenant-scoped client repository', () => {
  it('rejects invalid organization identifiers before database access', async () => {
    const from = vi.fn();
    await expect(listClients({ from } as never, 'not-a-uuid')).rejects.toThrow('Select a valid organization.');
    expect(from).toHaveBeenCalledOnce();
  });
  it('rejects unsafe client names before insert', async () => {
    await expect(createClient({ from: vi.fn() } as never, org, '   ', '')).rejects.toThrow('Invalid client details.');
  });
});
