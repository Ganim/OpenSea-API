/**
 * Wave 0 spec stub — Phase 11 / Plan 11-02 will implement
 * `src/modules/system/webhooks/lib/hmac-sign.ts`. Each `it()` failing
 * intentionally so Plan 11-02 has a Nyquist sampling target (D-04, D-05, D-08).
 */
import { describe, expect, it } from 'vitest';

describe('hmac-sign — webhook HMAC signature helpers (Plan 11-02 target)', () => {
  it('produz header `t=<unix>,v1=<hex>` com timestamp em segundos e digest hex 64 chars (D-04)', () => {
    expect(
      true,
      'Plan 11-02 must implement signWebhookPayload(secret, body, timestamp) returning header string `t=<unix_seconds>,v1=<hex_64>` (Stripe-style)',
    ).toBe(false);
  });

  it("usa createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex') (D-05)", () => {
    expect(
      true,
      'Plan 11-02 must use Node crypto.createHmac with SHA-256 over `${t}.${rawBody}` payload — not body alone',
    ).toBe(false);
  });

  it('gera secret 32 bytes prefixado `whsec_` em base64url (44 chars sem padding) (D-08)', () => {
    expect(
      true,
      'Plan 11-02 must implement generateWebhookSecret() returning whsec_<32 bytes base64url> — total length ~44 chars including prefix',
    ).toBe(false);
  });
});
