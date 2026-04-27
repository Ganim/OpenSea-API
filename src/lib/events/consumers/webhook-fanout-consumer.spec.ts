/**
 * Phase 11 / Plan 11-02 — webhook-fanout-consumer spec.
 *
 * D-16 (allowlist 5 events hardcoded) + D-35 (tenant-scoped) + D-01/D-02
 * (custom backoff + 5 attempts).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: { webhookEndpoint: { findMany: vi.fn() } },
  queueAdd: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/queue', () => ({
  createQueue: () => ({ add: mocks.queueAdd }),
}));

import { WEBHOOK_EVENT_ALLOWLIST } from '@/lib/events/webhook-events';

import { webhookFanoutConsumer } from './webhook-fanout-consumer';

const sampleEvent = {
  id: 'evt_abc',
  type: 'punch.time-entry.created',
  version: 1,
  tenantId: 't1',
  source: 'punch',
  sourceEntityType: 'time_entry',
  sourceEntityId: 'te_1',
  data: { timeEntryId: 'te_1' },
  timestamp: new Date().toISOString(),
};

describe('webhook-fanout-consumer', () => {
  beforeEach(() => {
    mocks.prisma.webhookEndpoint.findMany.mockReset();
    mocks.queueAdd.mockReset();
    mocks.queueAdd.mockResolvedValue({ id: 'job-1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribesTo === WEBHOOK_EVENT_ALLOWLIST (5 elementos exatos — D-16, Pitfall 12 — NÃO usar reflexão sobre PUNCH_EVENTS)', () => {
    expect([...webhookFanoutConsumer.subscribesTo]).toEqual([
      ...WEBHOOK_EVENT_ALLOWLIST,
    ]);
    expect(webhookFanoutConsumer.subscribesTo.length).toBe(5);
  });

  it('filtra endpoints por tenantId === event.tenantId (D-35 cross-tenant guard)', async () => {
    mocks.prisma.webhookEndpoint.findMany.mockResolvedValue([]);
    await webhookFanoutConsumer.handle(sampleEvent);

    expect(mocks.prisma.webhookEndpoint.findMany).toHaveBeenCalledTimes(1);
    const args = mocks.prisma.webhookEndpoint.findMany.mock.calls[0][0];
    expect(args.where.tenantId).toBe('t1');
  });

  it("filtra endpoints por status='ACTIVE' && deletedAt=null && subscribedEvents.has(event.type)", async () => {
    mocks.prisma.webhookEndpoint.findMany.mockResolvedValue([]);
    await webhookFanoutConsumer.handle(sampleEvent);

    const args = mocks.prisma.webhookEndpoint.findMany.mock.calls[0][0];
    expect(args.where.status).toBe('ACTIVE');
    expect(args.where.deletedAt).toBeNull();
    expect(args.where.subscribedEvents).toEqual({
      has: 'punch.time-entry.created',
    });
  });

  it('para cada endpoint match, chama queue.add com jobId=`${event.id}:${endpoint.id}` + attempts:5 + backoff: { type: "custom" }', async () => {
    mocks.prisma.webhookEndpoint.findMany.mockResolvedValue([
      { id: 'wh_1', url: 'https://a.example.com', apiVersion: '2026-04-27' },
      { id: 'wh_2', url: 'https://b.example.com', apiVersion: '2026-04-27' },
    ]);

    await webhookFanoutConsumer.handle(sampleEvent);

    expect(mocks.queueAdd).toHaveBeenCalledTimes(2);

    const call1 = mocks.queueAdd.mock.calls[0];
    const opts1 = call1[2];
    expect(opts1.jobId).toBe('evt_abc:wh_1');
    expect(opts1.attempts).toBe(5);
    expect(opts1.backoff).toEqual({ type: 'custom' });

    const call2 = mocks.queueAdd.mock.calls[1];
    const opts2 = call2[2];
    expect(opts2.jobId).toBe('evt_abc:wh_2');
  });
});
