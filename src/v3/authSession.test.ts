import { describe, expect, it, vi } from 'vitest';
import { requireAuthenticatedUser, signOutV3 } from './authSession';

describe('V3 authenticated boundary', () => {
  it('rejects anonymous access', async () => {
    await expect(requireAuthenticatedUser({auth:{getUser:async()=>({data:{user:null},error:null}),signOut:async()=>({error:null})}})).rejects.toThrow('Sign in');
  });
  it('accepts a verified auth identity', async () => {
    const user={id:'test-user',email:'a@example.test'};
    await expect(requireAuthenticatedUser({auth:{getUser:async()=>({data:{user},error:null}),signOut:async()=>({error:null})}})).resolves.toEqual(user);
  });
  it('signs out through the auth provider', async () => {
    const fn=vi.fn(async()=>({error:null}));
    await signOutV3({auth:{getUser:async()=>({data:{user:null},error:null}),signOut:fn}});
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
