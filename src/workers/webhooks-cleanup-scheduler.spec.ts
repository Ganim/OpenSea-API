/**
 * Phase 11 / Plan 11-02 — webhooks-cleanup-scheduler spec.
 *
 * D-23 (DELETE DEAD > 90d) + D-07 (UPDATE secretPrevious=null where expired)
 * + Redis SETNX lock multi-machine.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    webhookDelivery: { deleteMany: vi.fn() },
    webhookEndpoint: { updateMany: vi.fn() },
  },
  redis: {
    set: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/redis', () => ({
  getRedisClient: () => mocks.redis,
}));

import { runWebhooksCleanupIfDue } from './webhooks-cleanup-scheduler';

describe('webhooks-cleanup-scheduler', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  const ORIGINAL_BULLMQ = process.env.BULLMQ_ENABLED;

  beforeEach(() => {
    process.env.BULLMQ_ENABLED = 'true';
    mocks.prisma.webhookDelivery.deleteMany.mockReset();
    mocks.prisma.webhookEndpoint.updateMany.mockReset();
    mocks.redis.set.mockReset();
    mocks.prisma.webhookDelivery.deleteMany.mockResolvedValue({ count: 0 });
    mocks.prisma.webhookEndpoint.updateMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    process.env.BULLMQ_ENABLED = ORIGINAL_BULLMQ;
    vi.restoreAllMocks();
  });

  it('DELETE WebhookDelivery WHERE status=DEAD AND createdAt < NOW() - 90 dias (D-23)', async () => {
    mocks.redis.set.mockResolvedValue('OK');
    mocks.prisma.webhookDelivery.deleteMany.mockResolvedValue({ count: 7 });

    const result = await runWebhooksCleanupIfDue();
    expect(result?.deletedDead).toBe(7);

    expect(mocks.prisma.webhookDelivery.deleteMany).toHaveBeenCalledTimes(1);
    const args = mocks.prisma.webhookDelivery.deleteMany.mock.calls[0][0];
    expect(args.where.status).toBe('DEAD');
    expect(args.where.createdAt.lt).toBeInstanceOf(Date);
    // Verify cutoff = NOW - 90d (within 1 minute tolerance)
    const expectedCutoffMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const actualCutoffMs = (args.where.createdAt.lt as Date).getTime();
    expect(Math.abs(expectedCutoffMs - actualCutoffMs)).toBeLessThan(60_000);
  });

  it('UPDATE WebhookEndpoint SET secretPrevious=null WHERE secretPreviousExpiresAt < NOW() (D-07)', async () => {
    mocks.redis.set.mockResolvedValue('OK');
    mocks.prisma.webhookEndpoint.updateMany.mockResolvedValue({ count: 3 });

    const result = await runWebhooksCleanupIfDue();
    expect(result?.clearedSecrets).toBe(3);

    expect(mocks.prisma.webhookEndpoint.updateMany).toHaveBeenCalledTimes(1);
    const args = mocks.prisma.webhookEndpoint.updateMany.mock.calls[0][0];
    expect(args.where.secretPreviousExpiresAt.lt).toBeInstanceOf(Date);
    expect(args.data.secretPrevious).toBeNull();
    expect(args.data.secretPreviousExpiresAt).toBeNull();
  });

  it('Redis SETNX lock `webhooks:cleanup:dead-deliveries:${YYYY-MM-DD}` previne double-run multi-machine (Phase 7-05a pattern)', async () => {
    // Caso 1: lock acquired → cleanup runs
    mocks.redis.set.mockResolvedValueOnce('OK');
    await runWebhooksCleanupIfDue();
    expect(mocks.redis.set).toHaveBeenCalledTimes(1);
    const lockArgs = mocks.redis.set.mock.calls[0];
    expect(lockArgs[0]).toMatch(
      /^webhooks:cleanup:dead-deliveries:\d{4}-\d{2}-\d{2}$/,
    );
    expect(lockArgs[2]).toBe('EX');
    expect(lockArgs[4]).toBe('NX');

    // Caso 2: lock NOT acquired (já held por outra máquina) → skip
    mocks.prisma.webhookDelivery.deleteMany.mockReset();
    mocks.redis.set.mockResolvedValueOnce(null);
    const result = await runWebhooksCleanupIfDue();
    expect(result).toBeNull();
    expect(mocks.prisma.webhookDelivery.deleteMany).not.toHaveBeenCalled();
  });
});
