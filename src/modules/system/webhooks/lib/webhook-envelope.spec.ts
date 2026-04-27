/**
 * Wave 0 spec stub — Phase 11 / Plan 11-02 will implement
 * `src/modules/system/webhooks/lib/webhook-envelope.ts`. Each `it()` failing
 * describes the envelope shape per D-15 (Stripe-style).
 */
import { describe, expect, it } from 'vitest';

describe('webhook-envelope — Stripe-style envelope builder (Plan 11-02 target)', () => {
  it("buildEnvelope retorna { id: 'evt_<26char ulid>', type, created_at ISO, tenant_id, api_version, data, delivery: { attempt, webhook_id } } (D-15)", () => {
    expect(
      true,
      'Plan 11-02 must implement buildEnvelope({ type, tenantId, apiVersion, data, attempt, webhookId }) returning Stripe-style envelope with evt_<ulid> id and ISO created_at',
    ).toBe(false);
  });

  it('rawBody é JSON.stringify(envelope) — bytes assinados pelo HMAC (D-04 invariante)', () => {
    expect(
      true,
      'Plan 11-02 must expose rawBody as the JSON-serialized envelope bytes used by HMAC (deterministic key order required)',
    ).toBe(false);
  });
});
