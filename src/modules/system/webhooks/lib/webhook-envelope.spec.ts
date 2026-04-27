/**
 * Phase 11 / Plan 11-02 — webhook-envelope spec.
 *
 * D-15: Stripe-style envelope com `id: 'evt_<26-char ulid>'`, ISO created_at
 * e rawBody = JSON.stringify(envelope) (bytes assinados pelo HMAC — D-04).
 */
import { describe, expect, it } from 'vitest';

import { buildEnvelope } from './webhook-envelope';

describe('webhook-envelope — Stripe-style envelope builder', () => {
  it("buildEnvelope retorna { id: 'evt_<26char ulid>', type, created_at ISO, tenant_id, api_version, data, delivery: { attempt, webhook_id } } (D-15)", () => {
    const result = buildEnvelope({
      type: 'punch.time-entry.created',
      tenantId: 'tenant-abc',
      apiVersion: '2026-04-27',
      data: { timeEntryId: 'te_1' },
      webhookId: 'wh_1',
      attempt: 2,
    });

    // id must match evt_<26-char ulid> (Crockford base32: 0-9A-HJKMNP-TV-Z)
    expect(result.envelope.id).toMatch(/^evt_[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(result.eventId).toBe(result.envelope.id);

    // Campos canônicos D-15
    expect(result.envelope.type).toBe('punch.time-entry.created');
    expect(result.envelope.tenant_id).toBe('tenant-abc');
    expect(result.envelope.api_version).toBe('2026-04-27');
    expect(result.envelope.data).toEqual({ timeEntryId: 'te_1' });
    expect(result.envelope.delivery).toEqual({
      attempt: 2,
      webhook_id: 'wh_1',
    });

    // created_at: ISO 8601
    expect(result.envelope.created_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(Number.isFinite(Date.parse(result.envelope.created_at))).toBe(true);
  });

  it('rawBody é JSON.stringify(envelope) — bytes assinados pelo HMAC (D-04 invariante)', () => {
    const result = buildEnvelope({
      type: 'punch.device.paired',
      tenantId: 't1',
      apiVersion: '2026-04-27',
      data: { deviceId: 'd1', name: 'Kiosk' },
      webhookId: 'wh_1',
      attempt: 1,
    });

    expect(result.rawBody).toBe(JSON.stringify(result.envelope));
    // Round-trip: parse(rawBody) deve voltar ao envelope original (deterministic)
    expect(JSON.parse(result.rawBody)).toEqual(result.envelope);
  });
});
