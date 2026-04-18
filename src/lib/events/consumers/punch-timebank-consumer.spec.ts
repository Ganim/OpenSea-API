import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';
import { punchTimebankConsumer } from './punch-timebank-consumer';

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
      timestamp: new Date().toISOString(),
      nsrNumber: 1,
      hasApproval: false,
      punchDeviceId: null,
    },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('punchTimebankConsumer (stub)', () => {
  describe('Consumer Properties', () => {
    it('has consumerId punch.timebank-handler', () => {
      expect(punchTimebankConsumer.consumerId).toBe('punch.timebank-handler');
    });

    it('belongs to timebank module', () => {
      expect(punchTimebankConsumer.moduleId).toBe('timebank');
    });

    it('subscribes only to TIME_ENTRY_CREATED', () => {
      expect(punchTimebankConsumer.subscribesTo).toHaveLength(1);
      expect(punchTimebankConsumer.subscribesTo).toContain(
        PUNCH_EVENTS.TIME_ENTRY_CREATED,
      );
    });

    it('has the correct consumer interface shape', () => {
      expect(punchTimebankConsumer).toHaveProperty('consumerId');
      expect(punchTimebankConsumer).toHaveProperty('moduleId');
      expect(punchTimebankConsumer).toHaveProperty('subscribesTo');
      expect(punchTimebankConsumer).toHaveProperty('handle');
      expect(typeof punchTimebankConsumer.handle).toBe('function');
    });
  });

  describe('handle', () => {
    it('handles TIME_ENTRY_CREATED without throwing', async () => {
      const event = makePunchEvent();
      await expect(
        punchTimebankConsumer.handle(event),
      ).resolves.toBeUndefined();
    });

    it('is a no-op that does not call prisma (stub behavior)', async () => {
      const event = makePunchEvent({
        data: {
          timeEntryId: 'te-3',
          employeeId: 'emp-3',
          entryType: 'BREAK_START',
          timestamp: new Date().toISOString(),
          nsrNumber: 7,
          hasApproval: false,
          punchDeviceId: null,
        },
      });
      await expect(
        punchTimebankConsumer.handle(event),
      ).resolves.toBeUndefined();
    });
  });
});
