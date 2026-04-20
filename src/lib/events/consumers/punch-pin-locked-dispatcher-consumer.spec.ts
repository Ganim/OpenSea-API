import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';

// vi.hoisted() so refs are initialized BEFORE vi.mock factories run.
const mocks = vi.hoisted(() => ({
  dispatchMock: vi.fn().mockResolvedValue({
    notificationIds: ['n-1'],
    recipientCount: 1,
    deduplicated: false,
    suppressedByPreference: 0,
  }),
}));

vi.mock('@/modules/notifications/public', () => ({
  notificationClient: { dispatch: mocks.dispatchMock },
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

const dispatchMock = mocks.dispatchMock;

const { punchPinLockedDispatcherConsumer } = await import(
  './punch-pin-locked-dispatcher-consumer'
);

function makePinLockedEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  // 12 minutes in the future = floor((12*60 + small slack) / 60) ≥ 12
  const lockedUntil = new Date(
    Date.now() + 12 * 60 * 1000 + 1500,
  ).toISOString();
  return {
    id: randomUUID(),
    type: PUNCH_EVENTS.PIN_LOCKED,
    version: 1,
    tenantId: 'tenant-1',
    source: 'hr',
    sourceEntityType: 'employee',
    sourceEntityId: 'emp-1',
    data: {
      employeeId: 'emp-1',
      tenantId: 'tenant-1',
      employeeName: 'Maria Santos',
      lockedUntil,
      failedAttempts: 5,
    },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('punchPinLockedDispatcherConsumer', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    dispatchMock.mockResolvedValue({
      notificationIds: ['n-1'],
      recipientCount: 1,
      deduplicated: false,
      suppressedByPreference: 0,
    });
  });

  describe('Consumer Properties', () => {
    it('has consumerId punch.pin-locked-dispatcher', () => {
      expect(punchPinLockedDispatcherConsumer.consumerId).toBe(
        'punch.pin-locked-dispatcher',
      );
    });

    it('belongs to punch module', () => {
      expect(punchPinLockedDispatcherConsumer.moduleId).toBe('punch');
    });

    it('subscribes ONLY to PUNCH_EVENTS.PIN_LOCKED', () => {
      expect(punchPinLockedDispatcherConsumer.subscribesTo).toEqual([
        PUNCH_EVENTS.PIN_LOCKED,
      ]);
    });
  });

  describe('handle PIN_LOCKED', () => {
    it('dispatches ACTIONABLE punch.pin_locked to hr.punch-devices.admin', async () => {
      const event = makePinLockedEvent();
      await punchPinLockedDispatcherConsumer.handle(event);

      expect(dispatchMock).toHaveBeenCalledTimes(1);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.type).toBe('ACTIONABLE');
      expect(payload.category).toBe('punch.pin_locked');
      expect(payload.tenantId).toBe('tenant-1');
      expect(payload.recipients).toEqual({
        permission: 'hr.punch-devices.admin',
      });
    });

    it('title contains employeeName', async () => {
      const event = makePinLockedEvent();
      await punchPinLockedDispatcherConsumer.handle(event);

      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.title).toContain('Maria Santos');
    });

    it('body mentions minutes remaining (Portuguese)', async () => {
      const event = makePinLockedEvent();
      await punchPinLockedDispatcherConsumer.handle(event);

      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.body).toMatch(/min/i);
      expect(payload.body).toMatch(/\d+/);
    });

    it('body does NOT include the PIN value (T-PIN-02)', async () => {
      const event = makePinLockedEvent();
      await punchPinLockedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      // sanity: no 6-digit numeric run that could be mistaken for a PIN
      expect(payload.body).not.toMatch(/\b\d{6}\b/);
    });

    it('idempotencyKey = punch:pin-locked:{employeeId}:{lockedUntil}', async () => {
      const event = makePinLockedEvent();
      const lockedUntil = (event.data as { lockedUntil: string }).lockedUntil;
      await punchPinLockedDispatcherConsumer.handle(event);

      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.idempotencyKey).toBe(
        `punch:pin-locked:emp-1:${lockedUntil}`,
      );
    });

    it('entity ref points to the employee', async () => {
      const event = makePinLockedEvent();
      await punchPinLockedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.entity).toEqual({ type: 'employee', id: 'emp-1' });
    });

    it('metadata carries failedAttempts + lockedUntil', async () => {
      const event = makePinLockedEvent();
      const lockedUntil = (event.data as { lockedUntil: string }).lockedUntil;
      await punchPinLockedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.metadata).toMatchObject({
        failedAttempts: 5,
        lockedUntil,
      });
    });

    it('re-throws dispatch errors so typedEventBus can retry', async () => {
      dispatchMock.mockRejectedValueOnce(new Error('dispatcher offline'));
      const event = makePinLockedEvent();
      await expect(
        punchPinLockedDispatcherConsumer.handle(event),
      ).rejects.toThrow('dispatcher offline');
    });
  });
});
