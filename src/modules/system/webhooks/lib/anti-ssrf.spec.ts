/**
 * Phase 11 / Plan 11-02 — anti-ssrf lib spec.
 *
 * D-31: defesa em camadas (HTTPS-only em prod + blocklist + DNS resolve check
 * antes de cada delivery — TOCTOU 2-pass V1 simplification).
 *
 * Wave 0 (11-01) deixou stubs falhando; Wave 1 (11-02) implementa lib +
 * substitui stubs por assertions reais.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isPrivateIPv4,
  isPrivateIPv6,
  resolveAndValidateTarget,
  validateWebhookUrlOrThrow,
} from './anti-ssrf';

vi.mock('node:dns', () => ({
  promises: {
    lookup: vi.fn(),
  },
}));

import { promises as dns } from 'node:dns';

const mockedLookup = dns.lookup as unknown as ReturnType<typeof vi.fn>;

describe('anti-ssrf — URL validation + DNS blocklist (D-31)', () => {
  beforeEach(() => {
    mockedLookup.mockReset();
  });

  afterEach(() => {
    mockedLookup.mockReset();
  });

  it('rejeita 10.0.0.1, 127.0.0.1, 169.254.169.254 (AWS metadata), ::1, fc00::, fd00::, fe80::', () => {
    expect(isPrivateIPv4('10.0.0.1')).toBe(true);
    expect(isPrivateIPv4('127.0.0.1')).toBe(true);
    expect(isPrivateIPv4('169.254.169.254')).toBe(true);
    expect(isPrivateIPv4('192.168.0.10')).toBe(true);
    expect(isPrivateIPv4('172.16.5.5')).toBe(true);

    expect(isPrivateIPv6('::1')).toBe(true);
    expect(isPrivateIPv6('fc00::1')).toBe(true);
    expect(isPrivateIPv6('fd00::dead')).toBe(true);
    expect(isPrivateIPv6('fe80::1')).toBe(true);
    expect(isPrivateIPv6('ff02::1')).toBe(true);
  });

  it('aceita IPs públicos 1.1.1.1 e 2606:4700:4700::1111', () => {
    expect(isPrivateIPv4('1.1.1.1')).toBe(false);
    expect(isPrivateIPv4('8.8.8.8')).toBe(false);
    expect(isPrivateIPv6('2606:4700:4700::1111')).toBe(false);
    expect(isPrivateIPv6('2001:db8::1')).toBe(false);
  });

  it('rejeita DNS rebinding (mock dns/promises retorna mix público+privado)', async () => {
    mockedLookup.mockResolvedValueOnce([
      { address: '203.0.113.5', family: 4 },
      { address: '127.0.0.1', family: 4 }, // rebinding leak
    ]);

    await expect(
      resolveAndValidateTarget('attacker.example.com', /*isProduction*/ true),
    ).rejects.toThrow(/private|loopback|ssrf|rebinding/i);
  });

  it('em NODE_ENV=development aceita localhost/127.0.0.1/http:// (V1 dev/test bypass)', async () => {
    // dev: validateWebhookUrlOrThrow não deve resolver DNS nem rejeitar http://
    await expect(
      validateWebhookUrlOrThrow('http://localhost:3000/webhook', {
        isProduction: false,
      }),
    ).resolves.toBeUndefined();

    // resolveAndValidateTarget em dev aceita IP privado retornado pelo DNS
    mockedLookup.mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);
    const r = await resolveAndValidateTarget(
      'localhost',
      /*isProduction*/ false,
    );
    expect(r.ip).toBe('127.0.0.1');
  });

  it('em NODE_ENV=production rejeita http:// e força https://', async () => {
    await expect(
      validateWebhookUrlOrThrow('http://api.example.com/webhook', {
        isProduction: true,
      }),
    ).rejects.toThrow(/https/i);

    // Também rejeita IP literal privado direto sem DNS
    await expect(
      validateWebhookUrlOrThrow('https://10.0.0.1/webhook', {
        isProduction: true,
      }),
    ).rejects.toThrow(/private|loopback/i);

    // Aceita URL pública (mocked DNS retorna IP público)
    mockedLookup.mockResolvedValueOnce([{ address: '203.0.113.5', family: 4 }]);
    await expect(
      validateWebhookUrlOrThrow('https://api.example.com/webhook', {
        isProduction: true,
      }),
    ).resolves.toBeUndefined();
  });
});
