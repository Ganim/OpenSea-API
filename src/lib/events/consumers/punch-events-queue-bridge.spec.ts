import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';

// Hoisted mocks so the vi.mock factory captures a stable reference.
const mocks = vi.hoisted(() => ({
  addJobMock: vi.fn().mockResolvedValue({ id: 'job-1' }),
}));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: {
    PUNCH_EVENTS: 'punch-events',
  },
  addJob: mocks.addJobMock,
}));

const addJobMock = mocks.addJobMock;

const { punchEventsQueueBridge } = await import('./punch-events-queue-bridge');

function makePunchEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    id: randomUUID(),
    type: PUNCH_EVENTS.TIME_ENTRY_CREATED,
    version: 1,
    tenantId: 'tenant-1',
    source: 'hr',
    sourceEntityType: 'time_entry',
    sourceEntityId: 'te-1',
    data: {
      timeEntryId: 'te-1',
      employeeId: 'emp-1',
      entryType: 'CLOCK_IN',
      timestamp: '2026-04-18T12:00:00.000Z',
      nsrNumber: 1,
      hasApproval: false,
      punchDeviceId: null,
    },
    metadata: { userId: 'user-1' },
    timestamp: '2026-04-18T12:00:00.001Z',
    ...overrides,
  };
}

describe('punchEventsQueueBridge', () => {
  beforeEach(() => {
    addJobMock.mockClear();
    addJobMock.mockResolvedValue({ id: 'job-1' });
  });

  describe('Consumer Properties', () => {
    it('has consumerId punch.queue-bridge', () => {
      expect(punchEventsQueueBridge.consumerId).toBe('punch.queue-bridge');
    });

    it('belongs to punch module', () => {
      expect(punchEventsQueueBridge.moduleId).toBe('punch');
    });

    it('subscribes to every PUNCH_EVENTS value', () => {
      expect(punchEventsQueueBridge.subscribesTo.length).toBe(
        Object.values(PUNCH_EVENTS).length,
      );
      expect(punchEventsQueueBridge.subscribesTo.sort()).toEqual(
        [...Object.values(PUNCH_EVENTS)].sort(),
      );
    });
  });

  describe('handle', () => {
    it('forwards TIME_ENTRY_CREATED to the punch-events queue', async () => {
      const event = makePunchEvent({ id: 'evt-1' });

      await punchEventsQueueBridge.handle(event);

      expect(addJobMock).toHaveBeenCalledTimes(1);
      const [queueName, payload, options] = addJobMock.mock.calls[0];
      expect(queueName).toBe('punch-events');
      expect(payload).toEqual(
        expect.objectContaining({
          eventId: 'evt-1',
          type: PUNCH_EVENTS.TIME_ENTRY_CREATED,
          tenantId: 'tenant-1',
          source: 'hr',
          sourceEntityType: 'time_entry',
          sourceEntityId: 'te-1',
          occurredAt: '2026-04-18T12:00:00.001Z',
        }),
      );
      // Original event data is propagated, not lost
      expect(payload.data).toEqual(event.data);
      expect(payload.metadata).toEqual({ userId: 'user-1' });
      // BullMQ jobId mirrors the domain event id for dedup
      expect(options).toEqual({ jobId: 'evt-1' });
    });

    it('forwards APPROVAL_REQUESTED to the punch-events queue', async () => {
      const event = makePunchEvent({
        id: 'evt-2',
        type: PUNCH_EVENTS.APPROVAL_REQUESTED,
        sourceEntityType: 'punch_approval',
        sourceEntityId: 'ap-1',
        data: {
          approvalId: 'ap-1',
          timeEntryId: 'te-1',
          employeeId: 'emp-1',
          reason: 'OUT_OF_GEOFENCE',
        },
      });

      await punchEventsQueueBridge.handle(event);

      expect(addJobMock).toHaveBeenCalledTimes(1);
      const [queueName, payload] = addJobMock.mock.calls[0];
      expect(queueName).toBe('punch-events');
      expect(payload.type).toBe(PUNCH_EVENTS.APPROVAL_REQUESTED);
      expect(payload.sourceEntityId).toBe('ap-1');
    });

    it('re-throws addJob errors so the event bus can retry', async () => {
      addJobMock.mockRejectedValueOnce(new Error('redis down'));
      const event = makePunchEvent({ id: 'evt-3' });

      await expect(punchEventsQueueBridge.handle(event)).rejects.toThrow(
        'redis down',
      );
    });

    it('invokes addJob exactly once per event received', async () => {
      await punchEventsQueueBridge.handle(makePunchEvent({ id: 'a' }));
      await punchEventsQueueBridge.handle(makePunchEvent({ id: 'b' }));
      await punchEventsQueueBridge.handle(makePunchEvent({ id: 'c' }));

      expect(addJobMock).toHaveBeenCalledTimes(3);
      const ids = addJobMock.mock.calls.map((c) => c[0]);
      expect(ids).toEqual(['punch-events', 'punch-events', 'punch-events']);
    });
  });
});
