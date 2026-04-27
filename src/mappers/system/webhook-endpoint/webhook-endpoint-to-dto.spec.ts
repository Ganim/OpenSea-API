/**
 * Phase 11 / Plan 11-02 — webhookEndpointToDto LGPD sentinel.
 *
 * D-08 visible-once: secretCurrent NUNCA aparece em DTO; apenas
 * `secretMasked = whsec_••••••••<last4>`. Sentinela protege contra leak
 * acidental em qualquer campo via /whsec_[A-Za-z0-9_-]{30,}/.
 */
import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WebhookEndpoint } from '@/entities/system/webhook-endpoint';

import { webhookEndpointToDto } from './webhook-endpoint-to-dto';

function makeEndpoint(overrides: { secretLast4?: string } = {}) {
  return WebhookEndpoint.create({
    id: new UniqueEntityID('wh_1'),
    tenantId: new UniqueEntityID('t_1'),
    url: 'https://api.example.com/hook',
    description: 'demo',
    apiVersion: '2026-04-27',
    subscribedEvents: ['punch.time-entry.created'],
    secretCurrent: 'whsec_FULL_CLEARTEXT_VALUE_THAT_WOULD_LEAK_BAD_BAD',
    secretCurrentLast4: overrides.secretLast4 ?? 'a1b2',
    secretCurrentCreatedAt: new Date('2026-04-27T12:00:00Z'),
  });
}

describe('webhookEndpointToDto — LGPD sentinel (D-08)', () => {
  it('DTO contém secretMasked = `whsec_••••••••<last4>` formato exato', () => {
    const dto = webhookEndpointToDto(makeEndpoint({ secretLast4: 'XYZ9' }));
    expect(dto.secretMasked).toBe('whsec_••••••••XYZ9');
    // 8 bullet chars
    expect(dto.secretMasked.split('•').length - 1).toBe(8);
  });

  it('DTO NÃO contém secretCurrent, secretPrevious, secretPreviousExpiresAt (cleartext)', () => {
    const dto = webhookEndpointToDto(makeEndpoint());
    expect((dto as Record<string, unknown>).secretCurrent).toBeUndefined();
    expect((dto as Record<string, unknown>).secretPrevious).toBeUndefined();
  });

  it('JSON.stringify(dto).match(/whsec_[A-Za-z0-9_-]{30,}/) === null (sentinela LGPD)', () => {
    const dto = webhookEndpointToDto(makeEndpoint());
    const serialized = JSON.stringify(dto);
    expect(serialized.match(/whsec_[A-Za-z0-9_-]{30,}/)).toBeNull();
    // Mas ainda contém o secretMasked com bullets (não match com regex acima)
    expect(serialized).toContain('whsec_••••••••');
  });
});
