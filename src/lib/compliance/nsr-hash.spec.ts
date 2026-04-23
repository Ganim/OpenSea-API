import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @env before importing the module under test (Pitfall 4 unit-spec pattern).
// Unit project does not load .env — importing `@/@env` would throw at boot.
vi.mock('@/@env', () => ({
  env: {
    NODE_ENV: 'test',
    RECEIPT_HMAC_KEY: undefined,
  },
}));

import { computeReceiptNsrHash, isValidNsrHashFormat } from './nsr-hash';

describe('computeReceiptNsrHash', () => {
  beforeEach(() => {
    // The module-level `warned` latch is intentional (only first call warns).
    // Silence the warn so test output stays clean.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('é determinístico: 2 chamadas com mesmo input → mesmo output', () => {
    const h1 = computeReceiptNsrHash('tenant-x', 123);
    const h2 = computeReceiptNsrHash('tenant-x', 123);
    expect(h1).toBe(h2);
  });

  it('retorna hashes diferentes para tenants distintos com mesmo NSR', () => {
    const a = computeReceiptNsrHash('tenant-a', 42);
    const b = computeReceiptNsrHash('tenant-b', 42);
    expect(a).not.toBe(b);
  });

  it('retorna hashes diferentes para mesmo tenant e NSRs distintos', () => {
    const a = computeReceiptNsrHash('tenant-x', 1);
    const b = computeReceiptNsrHash('tenant-x', 2);
    expect(a).not.toBe(b);
  });

  it('retorna string com exatamente 64 caracteres', () => {
    const h = computeReceiptNsrHash('tenant-x', 1);
    expect(h).toHaveLength(64);
  });

  it('retorna apenas caracteres hex lowercase (a-f0-9)', () => {
    const h = computeReceiptNsrHash('tenant-x', 999);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejeita tenantId vazio', () => {
    expect(() => computeReceiptNsrHash('', 1)).toThrow(/tenantId/);
  });

  it('rejeita nsrNumber <= 0', () => {
    expect(() => computeReceiptNsrHash('tenant-x', 0)).toThrow(
      /inteiro positivo/,
    );
    expect(() => computeReceiptNsrHash('tenant-x', -1)).toThrow(
      /inteiro positivo/,
    );
  });

  it('rejeita nsrNumber não-inteiro', () => {
    expect(() => computeReceiptNsrHash('tenant-x', 1.5)).toThrow(
      /inteiro positivo/,
    );
  });
});

describe('isValidNsrHashFormat', () => {
  it('aceita 64 chars hex lowercase', () => {
    expect(isValidNsrHashFormat('a'.repeat(64))).toBe(true);
    expect(isValidNsrHashFormat(`${'0'.repeat(32)}${'f'.repeat(32)}`)).toBe(
      true,
    );
  });

  it('rejeita comprimento errado', () => {
    expect(isValidNsrHashFormat('a'.repeat(63))).toBe(false);
    expect(isValidNsrHashFormat('a'.repeat(65))).toBe(false);
    expect(isValidNsrHashFormat('')).toBe(false);
  });

  it('rejeita chars fora de [a-f0-9]', () => {
    expect(isValidNsrHashFormat('A'.repeat(64))).toBe(false); // uppercase
    expect(isValidNsrHashFormat('g'.repeat(64))).toBe(false);
    expect(isValidNsrHashFormat(`${'a'.repeat(63)}-`)).toBe(false);
  });
});
