import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

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
      timestamp: new Date().toISOString(),
      nsrNumber: 1,
      hasApproval: false,
      punchDeviceId: null,
    },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('punchEsocialConsumer (stub)', () => {
  describe('Consumer Properties', () => {
    it('has consumerId punch.esocial-handler', () => {
      expect(punchEsocialConsumer.consumerId).toBe('punch.esocial-handler');
    });

    it('belongs to esocial module', () => {
      expect(punchEsocialConsumer.moduleId).toBe('esocial');
    });

    it('subscribes only to TIME_ENTRY_CREATED', () => {
      expect(punchEsocialConsumer.subscribesTo).toHaveLength(1);
      expect(punchEsocialConsumer.subscribesTo).toContain(
        PUNCH_EVENTS.TIME_ENTRY_CREATED,
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

  describe('handle', () => {
    it('handles TIME_ENTRY_CREATED without throwing', async () => {
      const event = makePunchEvent();
      await expect(punchEsocialConsumer.handle(event)).resolves.toBeUndefined();
    });

    it('is a no-op that does not call prisma (stub behavior)', async () => {
      const event = makePunchEvent({
        data: {
          timeEntryId: 'te-4',
          employeeId: 'emp-4',
          entryType: 'CLOCK_OUT',
          timestamp: new Date().toISOString(),
          nsrNumber: 99,
          hasApproval: true,
          punchDeviceId: 'dev-2',
        },
      });
      await expect(punchEsocialConsumer.handle(event)).resolves.toBeUndefined();
    });
  });
});
