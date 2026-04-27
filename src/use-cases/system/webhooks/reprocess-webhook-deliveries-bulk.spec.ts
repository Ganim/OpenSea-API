/**
 * Phase 11 / Plan 11-02 — ReprocessWebhookDeliveriesBulkUseCase spec.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queueAdd: vi.fn(),
}));

vi.mock('@/lib/queue', () => ({
  createQueue: () => ({ add: mocks.queueAdd }),
}));

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  WebhookDelivery,
  MAX_MANUAL_REPROCESS,
} from '@/entities/system/webhook-delivery';
import { WebhookEndpoint } from '@/entities/system/webhook-endpoint';
import { InMemoryWebhookDeliveriesRepository } from '@/repositories/system/in-memory/in-memory-webhook-deliveries-repository';
import { InMemoryWebhookEndpointsRepository } from '@/repositories/system/in-memory/in-memory-webhook-endpoints-repository';

import { ReprocessWebhookDeliveryUseCase } from './reprocess-webhook-delivery';
import { ReprocessWebhookDeliveriesBulkUseCase } from './reprocess-webhook-deliveries-bulk';

const TENANT = 't1';
const ENDPOINT_ID = 'wh1';

function seedEndpoint(repo: InMemoryWebhookEndpointsRepository) {
  repo.items.push(
    WebhookEndpoint.create(
      {
        id: new UniqueEntityID(ENDPOINT_ID),
        tenantId: new UniqueEntityID(TENANT),
        url: 'https://api.example.com/hook',
        apiVersion: '2026-04-27',
        subscribedEvents: ['punch.time-entry.created'],
        secretCurrent: 'whsec_x',
        secretCurrentLast4: 'x123',
        secretCurrentCreatedAt: new Date(),
      },
      new UniqueEntityID(ENDPOINT_ID),
    ),
  );
}

function seedDelivery(
  repo: InMemoryWebhookDeliveriesRepository,
  id: string,
  overrides: Partial<{
    manualReprocessCount: number;
    lastManualReprocessAt: Date | null;
  }> = {},
) {
  repo.items.push(
    WebhookDelivery.create(
      {
        id: new UniqueEntityID(id),
        tenantId: new UniqueEntityID(TENANT),
        endpointId: new UniqueEntityID(ENDPOINT_ID),
        eventId: `evt_${id}`,
        eventType: 'punch.time-entry.created',
        payloadHash: 'h',
        status: 'DEAD',
        manualReprocessCount: overrides.manualReprocessCount ?? 0,
        lastManualReprocessAt: overrides.lastManualReprocessAt ?? null,
      },
      new UniqueEntityID(id),
    ),
  );
}

describe('ReprocessWebhookDeliveriesBulkUseCase', () => {
  let endpointsRepo: InMemoryWebhookEndpointsRepository;
  let deliveriesRepo: InMemoryWebhookDeliveriesRepository;
  let bulkUseCase: ReprocessWebhookDeliveriesBulkUseCase;

  beforeEach(() => {
    mocks.queueAdd.mockReset();
    mocks.queueAdd.mockResolvedValue({ id: 'queue-job-id' });
    endpointsRepo = new InMemoryWebhookEndpointsRepository();
    deliveriesRepo = new InMemoryWebhookDeliveriesRepository();
    seedEndpoint(endpointsRepo);
    bulkUseCase = new ReprocessWebhookDeliveriesBulkUseCase(
      new ReprocessWebhookDeliveryUseCase(deliveriesRepo, endpointsRepo),
    );
  });

  afterEach(() => {
    mocks.queueAdd.mockReset();
  });

  it('bulk respeita cap individual por delivery (cada uma com max 3 + cooldown 30s)', async () => {
    // 3 deliveries: 1 OK, 1 cap, 1 cooldown
    seedDelivery(deliveriesRepo, 'd-ok', {
      manualReprocessCount: 0,
      lastManualReprocessAt: null,
    });
    seedDelivery(deliveriesRepo, 'd-cap', {
      manualReprocessCount: MAX_MANUAL_REPROCESS,
      lastManualReprocessAt: new Date(Date.now() - 60_000),
    });
    seedDelivery(deliveriesRepo, 'd-cool', {
      manualReprocessCount: 1,
      lastManualReprocessAt: new Date(Date.now() - 5_000),
    });

    const result = await bulkUseCase.execute({
      deliveryIds: ['d-ok', 'd-cap', 'd-cool'],
      tenantId: TENANT,
    });

    expect(result.enqueued).toBe(1);
    expect(result.skippedCap).toEqual(['d-cap']);
    expect(result.skippedCooldown).toEqual(['d-cool']);
  });

  it('retorna { enqueued: N, skippedCooldown: M, skippedCap: K } agregado', async () => {
    seedDelivery(deliveriesRepo, 'd1', {});
    seedDelivery(deliveriesRepo, 'd2', {});
    const result = await bulkUseCase.execute({
      deliveryIds: ['d1', 'd2'],
      tenantId: TENANT,
    });
    expect(result.enqueued).toBe(2);
    expect(result.skippedCap).toEqual([]);
    expect(result.skippedCooldown).toEqual([]);
    expect(result.errors).toEqual([]);
  });
});
