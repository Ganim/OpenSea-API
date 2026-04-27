/**
 * Phase 11 / Plan 11-02 — webhookDeliveryToDto.
 *
 * D-29 (1KB truncate) + Pitfall 5 (sanitize whsec_* echo) + signature mask.
 */
import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WebhookDelivery } from '@/entities/system/webhook-delivery';

import {
  maskSignatureHeader,
  webhookDeliveryToDto,
} from './webhook-delivery-to-dto';

function makeDelivery(
  overrides: {
    responseBody?: string | null;
    errorMessage?: string | null;
  } = {},
) {
  return WebhookDelivery.create({
    id: new UniqueEntityID('d_1'),
    tenantId: new UniqueEntityID('t_1'),
    endpointId: new UniqueEntityID('wh_1'),
    eventId: 'evt_abc',
    eventType: 'punch.time-entry.created',
    payloadHash: 'hash_xyz',
    lastResponseBody: overrides.responseBody ?? null,
    lastErrorMessage: overrides.errorMessage ?? null,
  });
}

describe('webhookDeliveryToDto — D-29 + Pitfall 5', () => {
  it('responseBody truncado a 1024 chars (D-29)', () => {
    const big = 'A'.repeat(2048);
    const dto = webhookDeliveryToDto(makeDelivery({ responseBody: big }));
    expect(dto.responseBodyTruncated).not.toBeNull();
    expect(dto.responseBodyTruncated!.length).toBe(1024);
  });

  it('lastErrorMessage sanitiza `whsec_*` para `whsec_••••` (Pitfall 5 — secret eco do customer)', () => {
    const echo =
      'Customer endpoint replied with secret echo: whsec_VERY_LONG_SECRET_VALUE_LEAKED_BACK_BAD_BAD';
    const dto = webhookDeliveryToDto(makeDelivery({ errorMessage: echo }));
    expect(dto.lastErrorMessage).toContain('whsec_••••');
    expect(dto.lastErrorMessage!.match(/whsec_[A-Za-z0-9_-]{30,}/)).toBeNull();
  });

  it('header X-OpenSea-Signature mascarado após primeiros 8 chars do hex no DTO', () => {
    const sig = 't=1700000000,v1=' + 'a'.repeat(64);
    const masked = maskSignatureHeader(sig);
    expect(masked).toMatch(/^t=\d+,v1=[a-f0-9]{8}\.\.\.$/);
    // Não deve expor o digest completo
    expect(masked).not.toContain('a'.repeat(64));
  });
});
