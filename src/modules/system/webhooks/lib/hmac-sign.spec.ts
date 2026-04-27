/**
 * Phase 11 / Plan 11-02 — hmac-sign lib spec.
 *
 * D-04 (header `t=,v1=`), D-05 (HMAC-SHA256 sobre `${t}.${rawBody}`),
 * D-08 (secret prefixado `whsec_` + base64url 32 bytes).
 */
import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  generateWebhookSecret,
  getSecretLast4,
  signWebhookPayload,
} from './hmac-sign';

describe('hmac-sign — webhook HMAC signature helpers', () => {
  it('produz header `t=<unix>,v1=<hex>` com timestamp em segundos e digest hex 64 chars (D-04)', () => {
    const fixedNow = new Date('2026-04-27T12:00:00.000Z');
    const result = signWebhookPayload(
      '{"hello":"world"}',
      'whsec_secret',
      fixedNow,
    );

    const expectedT = Math.floor(fixedNow.getTime() / 1000);
    expect(result.timestamp).toBe(expectedT);

    expect(result.signatureHeader).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    expect(result.signatureHeader.startsWith(`t=${expectedT},v1=`)).toBe(true);
    expect(result.signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it("usa createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex') (D-05)", () => {
    const now = new Date('2026-04-27T12:00:00.000Z');
    const t = Math.floor(now.getTime() / 1000);
    const rawBody = '{"id":"evt_123","type":"punch.time-entry.created"}';
    const secret = 'whsec_test_secret_value';

    const expected = createHmac('sha256', secret)
      .update(`${t}.${rawBody}`)
      .digest('hex');

    const result = signWebhookPayload(rawBody, secret, now);
    expect(result.signature).toBe(expected);

    // Sanity: assinatura sobre body puro NÃO deve coincidir
    const wrong = createHmac('sha256', secret).update(rawBody).digest('hex');
    expect(result.signature).not.toBe(wrong);
  });

  it('gera secret 32 bytes prefixado `whsec_` em base64url (44 chars sem padding) (D-08)', () => {
    const secret = generateWebhookSecret();

    expect(secret.startsWith('whsec_')).toBe(true);
    // base64url(32 bytes) = ceil(32 * 8 / 6) = 43 chars sem padding
    expect(secret.length).toBe('whsec_'.length + 43);
    // base64url alphabet: A-Z a-z 0-9 - _ (no '=' padding)
    expect(secret.slice('whsec_'.length)).toMatch(/^[A-Za-z0-9_-]+$/);

    // Cada chamada gera secret diferente
    const secret2 = generateWebhookSecret();
    expect(secret2).not.toBe(secret);

    // last4 helper retorna últimos 4 chars
    expect(getSecretLast4(secret)).toBe(secret.slice(-4));
  });
});
