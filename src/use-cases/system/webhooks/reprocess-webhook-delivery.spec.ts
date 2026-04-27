/**
 * Phase 11 / Plan 11-02 — ReprocessWebhookDeliveryUseCase spec.
 *
 * D-21 (cap 3 + cooldown 30s) + D-22 (jobId determinístico + attempts:1).
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

import {
  ManualReprocessCapReachedError,
  ManualReprocessCooldownError,
  ReprocessWebhookDeliveryUseCase,
} from './reprocess-webhook-delivery';

const TENANT = 't1';
const ENDPOINT_ID = 'wh1';
const EVENT_ID = 'evt_abc';

function seedEndpoint(repo: InMemoryWebhookEndpointsRepository) {
  const e = WebhookEndpoint.create(
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
  );
  repo.items.push(e);
  return e;
}

function seedDelivery(
  repo: InMemoryWebhookDeliveriesRepository,
  overrides: Partial<{
    manualReprocessCount: number;
    lastManualReprocessAt: Date | null;
  }> = {},
) {
  const d = WebhookDelivery.create(
    {
      id: new UniqueEntityID('d1'),
      tenantId: new UniqueEntityID(TENANT),
      endpointId: new UniqueEntityID(ENDPOINT_ID),
      eventId: EVENT_ID,
      eventType: 'punch.time-entry.created',
      payloadHash: 'h',
      status: 'DEAD',
      manualReprocessCount: overrides.manualReprocessCount ?? 0,
      lastManualReprocessAt: overrides.lastManualReprocessAt ?? null,
    },
    new UniqueEntityID('d1'),
  );
  repo.items.push(d);
  return d;
}

describe('ReprocessWebhookDeliveryUseCase', () => {
  let endpointsRepo: InMemoryWebhookEndpointsRepository;
  let deliveriesRepo: InMemoryWebhookDeliveriesRepository;
  let useCase: ReprocessWebhookDeliveryUseCase;

  beforeEach(() => {
    mocks.queueAdd.mockReset();
    mocks.queueAdd.mockResolvedValue({ id: 'queue-job-id' });
    endpointsRepo = new InMemoryWebhookEndpointsRepository();
    deliveriesRepo = new InMemoryWebhookDeliveriesRepository();
    seedEndpoint(endpointsRepo);
    useCase = new ReprocessWebhookDeliveryUseCase(
      deliveriesRepo,
      endpointsRepo,
    );
  });

  afterEach(() => {
    mocks.queueAdd.mockReset();
  });

  it('max 3 reenvios manuais por delivery (D-21) — 4ª chamada lança 422', async () => {
    seedDelivery(deliveriesRepo, {
      manualReprocessCount: MAX_MANUAL_REPROCESS, // 3 já feitos
      lastManualReprocessAt: new Date(Date.now() - 60_000), // cooldown OK
    });
    await expect(
      useCase.execute({ deliveryId: 'd1', tenantId: TENANT }),
    ).rejects.toBeInstanceOf(ManualReprocessCapReachedError);
  });

  it('cooldown 30s entre reenvios — chamadas em < 30s lançam 422 backend (não confiar UI)', async () => {
    seedDelivery(deliveriesRepo, {
      manualReprocessCount: 1,
      lastManualReprocessAt: new Date(Date.now() - 5_000), // 5s — em cooldown
    });
    await expect(
      useCase.execute({ deliveryId: 'd1', tenantId: TENANT }),
    ).rejects.toBeInstanceOf(ManualReprocessCooldownError);
  });

  it('novo job em queue usa jobId `${eventId}:${webhookId}:retry-${manualReprocessCount + 1}` + attempts: 1 (D-22 tentativa única)', async () => {
    seedDelivery(deliveriesRepo, {
      manualReprocessCount: 0,
      lastManualReprocessAt: null,
    });

    const result = await useCase.execute({
      deliveryId: 'd1',
      tenantId: TENANT,
    });

    expect(result.enqueued).toBe(true);
    expect(result.newReprocessCount).toBe(1);
    expect(result.jobId).toBe(`${EVENT_ID}:${ENDPOINT_ID}:retry-1`);

    expect(mocks.queueAdd).toHaveBeenCalledTimes(1);
    const callArgs = mocks.queueAdd.mock.calls[0];
    const opts = callArgs[2] as { jobId: string; attempts: number };
    expect(opts.jobId).toBe(`${EVENT_ID}:${ENDPOINT_ID}:retry-1`);
    expect(opts.attempts).toBe(1);
  });
});
