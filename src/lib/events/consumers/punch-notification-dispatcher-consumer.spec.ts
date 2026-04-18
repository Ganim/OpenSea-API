import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';

// vi.hoisted() so that the mock refs are initialized BEFORE vi.mock factories run.
// Without this, the lazy closure inside the factory captures `undefined` at hoist time.
const mocks = vi.hoisted(() => ({
  dispatchMock: vi.fn().mockResolvedValue({
    notificationIds: ['n-1'],
    recipientCount: 1,
    deduplicated: false,
    suppressedByPreference: 0,
  }),
  findFirstMock: vi.fn().mockResolvedValue({ userId: 'user-123' }),
}));

// Mock notificationClient
vi.mock('@/modules/notifications/public', () => ({
  notificationClient: {
    dispatch: mocks.dispatchMock,
  },
  NotificationType: {
    INFORMATIONAL: 'INFORMATIONAL',
    LINK: 'LINK',
    ACTIONABLE: 'ACTIONABLE',
    APPROVAL: 'APPROVAL',
    FORM: 'FORM',
    PROGRESS: 'PROGRESS',
    SYSTEM_BANNER: 'SYSTEM_BANNER',
  },
}));

// Mock prisma (employee lookup for userId resolution)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findFirst: mocks.findFirstMock,
    },
  },
}));

const findFirstMock = mocks.findFirstMock;
const dispatchMock = mocks.dispatchMock;

// Import AFTER the mocks so the mocked modules are loaded
const { punchNotificationDispatcherConsumer } = await import(
  './punch-notification-dispatcher-consumer'
);

function makeTimeEntryCreatedEvent(
  overrides: Partial<DomainEvent> = {},
): DomainEvent {
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
    timestamp: '2026-04-18T12:00:00.001Z',
    ...overrides,
  };
}

function makeApprovalRequestedEvent(
  overrides: Partial<DomainEvent> = {},
): DomainEvent {
  return {
    id: randomUUID(),
    type: PUNCH_EVENTS.APPROVAL_REQUESTED,
    version: 1,
    tenantId: 'tenant-1',
    source: 'hr',
    sourceEntityType: 'punch_approval',
    sourceEntityId: 'ap-1',
    data: {
      approvalId: 'ap-1',
      timeEntryId: 'te-1',
      employeeId: 'emp-1',
      reason: 'OUT_OF_GEOFENCE',
      details: { distance: 120, zoneId: 'zone-1' },
    },
    timestamp: '2026-04-18T12:00:00.001Z',
    ...overrides,
  };
}

describe('punchNotificationDispatcherConsumer', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    dispatchMock.mockResolvedValue({
      notificationIds: ['n-1'],
      recipientCount: 1,
      deduplicated: false,
      suppressedByPreference: 0,
    });
    findFirstMock.mockClear();
    findFirstMock.mockResolvedValue({ userId: 'user-123' });
  });

  describe('Consumer Properties', () => {
    it('has consumerId punch.notification-dispatcher', () => {
      expect(punchNotificationDispatcherConsumer.consumerId).toBe(
        'punch.notification-dispatcher',
      );
    });

    it('belongs to punch module', () => {
      expect(punchNotificationDispatcherConsumer.moduleId).toBe('punch');
    });

    it('subscribes to TIME_ENTRY_CREATED and APPROVAL_REQUESTED', () => {
      expect(punchNotificationDispatcherConsumer.subscribesTo).toHaveLength(2);
      expect(punchNotificationDispatcherConsumer.subscribesTo).toContain(
        PUNCH_EVENTS.TIME_ENTRY_CREATED,
      );
      expect(punchNotificationDispatcherConsumer.subscribesTo).toContain(
        PUNCH_EVENTS.APPROVAL_REQUESTED,
      );
    });
  });

  describe('handle TIME_ENTRY_CREATED', () => {
    it('resolves userId via employee lookup and dispatches punch.registered', async () => {
      const event = makeTimeEntryCreatedEvent();
      await punchNotificationDispatcherConsumer.handle(event);

      expect(findFirstMock).toHaveBeenCalledTimes(1);
      expect(findFirstMock).toHaveBeenCalledWith({
        where: { id: 'emp-1', tenantId: 'tenant-1' },
        select: { userId: true },
      });

      expect(dispatchMock).toHaveBeenCalledTimes(1);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.type).toBe('INFORMATIONAL');
      expect(payload.category).toBe('punch.registered');
      expect(payload.tenantId).toBe('tenant-1');
      expect(payload.recipients).toEqual({ userIds: ['user-123'] });
      expect(payload.idempotencyKey).toBe('punch:registered:te-1');
      expect(payload.entity).toEqual({ type: 'time_entry', id: 'te-1' });
      expect(payload.title).toBe('Ponto registrado');
    });

    it('skips dispatch when employee has no linked userId', async () => {
      findFirstMock.mockResolvedValueOnce({ userId: null });
      const event = makeTimeEntryCreatedEvent();

      await punchNotificationDispatcherConsumer.handle(event);

      expect(findFirstMock).toHaveBeenCalledTimes(1);
      expect(dispatchMock).not.toHaveBeenCalled();
    });

    it('skips dispatch when employee is not found', async () => {
      findFirstMock.mockResolvedValueOnce(null);
      const event = makeTimeEntryCreatedEvent();

      await punchNotificationDispatcherConsumer.handle(event);

      expect(dispatchMock).not.toHaveBeenCalled();
    });

    it('includes metadata fields (entryType, hasApproval, punchDeviceId)', async () => {
      const event = makeTimeEntryCreatedEvent({
        data: {
          timeEntryId: 'te-2',
          employeeId: 'emp-1',
          entryType: 'CLOCK_OUT',
          timestamp: '2026-04-18T18:00:00.000Z',
          nsrNumber: 2,
          hasApproval: true,
          punchDeviceId: 'dev-1',
        },
      });
      await punchNotificationDispatcherConsumer.handle(event);

      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.metadata).toEqual({
        entryType: 'CLOCK_OUT',
        hasApproval: true,
        punchDeviceId: 'dev-1',
      });
      expect(payload.idempotencyKey).toBe('punch:registered:te-2');
    });
  });

  describe('handle APPROVAL_REQUESTED', () => {
    it('dispatches punch.approval_requested to hr.punch-approvals.admin', async () => {
      const event = makeApprovalRequestedEvent();
      await punchNotificationDispatcherConsumer.handle(event);

      expect(dispatchMock).toHaveBeenCalledTimes(1);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.type).toBe('APPROVAL');
      expect(payload.category).toBe('punch.approval_requested');
      expect(payload.recipients).toEqual({
        permission: 'hr.punch-approvals.admin',
      });
      expect(payload.idempotencyKey).toBe('punch:approval:ap-1');
      expect(payload.entity).toEqual({
        type: 'punch_approval',
        id: 'ap-1',
      });
      expect(payload.callbackUrl).toBe('/v1/hr/punch-approvals/ap-1/resolve');
      expect(payload.metadata).toEqual({
        reason: 'OUT_OF_GEOFENCE',
        timeEntryId: 'te-1',
        details: { distance: 120, zoneId: 'zone-1' },
      });
    });

    it('does NOT look up employee for approval events', async () => {
      const event = makeApprovalRequestedEvent();
      await punchNotificationDispatcherConsumer.handle(event);

      expect(findFirstMock).not.toHaveBeenCalled();
      expect(dispatchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('re-throws dispatcher errors so the event bus can retry', async () => {
      dispatchMock.mockRejectedValueOnce(new Error('dispatcher offline'));

      const event = makeApprovalRequestedEvent();
      await expect(
        punchNotificationDispatcherConsumer.handle(event),
      ).rejects.toThrow('dispatcher offline');
    });

    it('ignores unrelated event types silently', async () => {
      const event = {
        ...makeTimeEntryCreatedEvent(),
        type: 'sales.order.confirmed',
      };

      await punchNotificationDispatcherConsumer.handle(event);
      expect(dispatchMock).not.toHaveBeenCalled();
    });
  });
});
