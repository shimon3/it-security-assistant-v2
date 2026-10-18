import { describe, expect, it } from 'vitest';
import { clientTitle, validClientName } from './clientModels';

describe('V3 client creation rules',()=>{
  it('rejects blank and overlength company names',()=>{
    expect(validClientName('   ')).toBe(false);
    expect(validClientName('X'.repeat(161))).toBe(false);
    expect(validClientName('Example company')).toBe(true);
  });
  it('handles optional company domain',()=>{
    expect(clientTitle('Example', '')).toBe('Example');
    expect(clientTitle(' Example ', ' example.test ')).toBe('Example — example.test');
  });
});
