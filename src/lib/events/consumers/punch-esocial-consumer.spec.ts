import { randomUUID } from 'node:crypto';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

// Hoisted mocks (Plan 04-05 pattern — vi.mock usa factory closure).
const mocks = vi.hoisted(() => {
  return {
    sadd: vi.fn<(key: string, member: string) => Promise<number>>(),
    expire: vi.fn<(key: string, seconds: number) => Promise<number>>(),
  };
});

vi.mock('@/lib/redis', () => ({
  redis: {
    get client() {
      return {
        sadd: mocks.sadd,
        expire: mocks.expire,
      };
    },
  },
}));

import type { DomainEvent } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';
import { punchEsocialConsumer } from './punch-esocial-consumer';

function makePunchEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    id: randomUUID(),
    type: PUNCH_EVENTS.TIME_ENTRY_CREATED,
    version: 1,
    tenantId: 'tenant-1',
    source: 'hr',
    sourceEntityType: 'time_entry',
    sourceEntityId: randomUUID(),
    data: {
      timeEntryId: 'te-1',
      employeeId: 'emp-1',
      entryType: 'CLOCK_IN',
      timestamp: '2026-04-15T08:00:00.000Z',
      nsrNumber: 1,
      hasApproval: false,
      punchDeviceId: null,
    },
    timestamp: '2026-04-15T08:00:00.000Z',
    ...overrides,
  };
}

describe('punchEsocialConsumer (compliance.s1200-cache-invalidator)', () => {
  beforeEach(() => {
    mocks.sadd.mockResolvedValue(1);
    mocks.expire.mockResolvedValue(1);
  });

  afterEach(() => {
    mocks.sadd.mockClear();
    mocks.expire.mockClear();
  });

  describe('Consumer Properties', () => {
    it('has consumerId compliance.s1200-cache-invalidator', () => {
      expect(punchEsocialConsumer.consumerId).toBe(
        'compliance.s1200-cache-invalidator',
      );
    });

    it('belongs to compliance module', () => {
      expect(punchEsocialConsumer.moduleId).toBe('compliance');
    });

    it('subscribes to TIME_ENTRY_CREATED and APPROVAL_RESOLVED', () => {
      expect(punchEsocialConsumer.subscribesTo).toHaveLength(2);
      expect(punchEsocialConsumer.subscribesTo).toContain(
        PUNCH_EVENTS.TIME_ENTRY_CREATED,
      );
      expect(punchEsocialConsumer.subscribesTo).toContain(
        PUNCH_EVENTS.APPROVAL_RESOLVED,
      );
    });

    it('has the correct consumer interface shape', () => {
      expect(punchEsocialConsumer).toHaveProperty('consumerId');
      expect(punchEsocialConsumer).toHaveProperty('moduleId');
      expect(punchEsocialConsumer).toHaveProperty('subscribesTo');
      expect(punchEsocialConsumer).toHaveProperty('handle');
      expect(typeof punchEsocialConsumer.handle).toBe('function');
    });
  });

  describe('handle TIME_ENTRY_CREATED', () => {
    it('calls redis.sadd with esocial:s1200:{tenantId}:{YYYY-MM}:touched + expire 90 days', async () => {
      const event = makePunchEvent({
        tenantId: 'tenant-42',
        data: {
          timeEntryId: 'te-1',
          employeeId: 'emp-99',
          entryType: 'CLOCK_IN',
          timestamp: '2026-04-15T08:30:00.000Z',
          nsrNumber: 1,
          hasApproval: false,
          punchDeviceId: null,
        },
      });

      await punchEsocialConsumer.handle(event);

      expect(mocks.sadd).toHaveBeenCalledTimes(1);
      expect(mocks.sadd).toHaveBeenCalledWith(
        'esocial:s1200:tenant-42:2026-04:touched',
        'emp-99',
      );
      expect(mocks.expire).toHaveBeenCalledWith(
        'esocial:s1200:tenant-42:2026-04:touched',
        60 * 60 * 24 * 90,
      );
    });
  });

  describe('handle APPROVAL_RESOLVED', () => {
    it('calls redis.sadd when event is APPROVAL_RESOLVED with employeeId + resolvedAt', async () => {
      const event = makePunchEvent({
        type: PUNCH_EVENTS.APPROVAL_RESOLVED,
        tenantId: 'tenant-42',
        data: {
          approvalId: 'appr-1',
          timeEntryId: 'te-1',
          employeeId: 'emp-99',
          status: 'APPROVED',
          resolverUserId: 'user-1',
          resolvedAt: '2026-04-20T14:00:00.000Z',
        },
      });

      await punchEsocialConsumer.handle(event);

      expect(mocks.sadd).toHaveBeenCalledWith(
        'esocial:s1200:tenant-42:2026-04:touched',
        'emp-99',
      );
      expect(mocks.expire).toHaveBeenCalled();
    });
  });

  describe('defensive guards', () => {
    it('no-ops silently when timestamp is missing from payload', async () => {
      const event = makePunchEvent({
        data: {
          timeEntryId: 'te-1',
          employeeId: 'emp-1',
          entryType: 'CLOCK_IN',
          nsrNumber: 1,
          hasApproval: false,
          punchDeviceId: null,
          // timestamp intentionally absent (malformed payload)
        } as unknown as Record<string, unknown>,
      });

      await punchEsocialConsumer.handle(event);

      expect(mocks.sadd).not.toHaveBeenCalled();
    });

    it('no-ops silently when employeeId is missing from payload', async () => {
      const event = makePunchEvent({
        data: {
          timeEntryId: 'te-1',
          timestamp: '2026-04-15T08:00:00.000Z',
          // employeeId intentionally absent
        } as unknown as Record<string, unknown>,
      });

      await punchEsocialConsumer.handle(event);

      expect(mocks.sadd).not.toHaveBeenCalled();
    });

    it('does not throw when redis.sadd fails (best-effort)', async () => {
      mocks.sadd.mockRejectedValueOnce(new Error('Redis down'));
      const event = makePunchEvent();

      await expect(punchEsocialConsumer.handle(event)).resolves.toBeUndefined();
    });

    it('does not throw when redis.expire fails (best-effort)', async () => {
      mocks.expire.mockRejectedValueOnce(new Error('Redis down'));
      const event = makePunchEvent();

      await expect(punchEsocialConsumer.handle(event)).resolves.toBeUndefined();
    });
  });

  describe('competência derivation', () => {
    it('derives YYYY-MM from ISO timestamp regardless of day/time', async () => {
      const event = makePunchEvent({
        tenantId: 't-1',
        data: {
          timeEntryId: 'te-1',
          employeeId: 'emp-1',
          entryType: 'CLOCK_IN',
          timestamp: '2026-12-31T23:59:59.999Z',
          nsrNumber: 1,
          hasApproval: false,
          punchDeviceId: null,
        },
      });

      await punchEsocialConsumer.handle(event);

      expect(mocks.sadd).toHaveBeenCalledWith(
        'esocial:s1200:t-1:2026-12:touched',
        'emp-1',
      );
    });
  });

  // Unused vi hint to silence import warning if we end up not using it
  const _unusedMock: MockInstance | null = null;
  it('type-guard import', () => expect(_unusedMock).toBeNull());
});
