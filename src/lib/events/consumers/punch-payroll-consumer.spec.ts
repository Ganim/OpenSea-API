import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';
import { punchPayrollConsumer } from './punch-payroll-consumer';

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

describe('punchPayrollConsumer (stub)', () => {
  describe('Consumer Properties', () => {
    it('has consumerId punch.payroll-handler', () => {
      expect(punchPayrollConsumer.consumerId).toBe('punch.payroll-handler');
    });

    it('belongs to payroll module', () => {
      expect(punchPayrollConsumer.moduleId).toBe('payroll');
    });

    it('subscribes only to TIME_ENTRY_CREATED', () => {
      expect(punchPayrollConsumer.subscribesTo).toHaveLength(1);
      expect(punchPayrollConsumer.subscribesTo).toContain(
        PUNCH_EVENTS.TIME_ENTRY_CREATED,
      );
    });

    it('has the correct consumer interface shape', () => {
      expect(punchPayrollConsumer).toHaveProperty('consumerId');
      expect(punchPayrollConsumer).toHaveProperty('moduleId');
      expect(punchPayrollConsumer).toHaveProperty('subscribesTo');
      expect(punchPayrollConsumer).toHaveProperty('handle');
      expect(typeof punchPayrollConsumer.handle).toBe('function');
    });
  });

  describe('handle', () => {
    it('handles TIME_ENTRY_CREATED without throwing', async () => {
      const event = makePunchEvent();
      await expect(punchPayrollConsumer.handle(event)).resolves.toBeUndefined();
    });

    it('is a no-op that does not call prisma (stub behavior)', async () => {
      // The stub does not import prisma at runtime — verified by file-level
      // grep in the acceptance criteria. Here we simply confirm it resolves.
      const event = makePunchEvent({
        data: {
          timeEntryId: 'te-2',
          employeeId: 'emp-2',
          entryType: 'CLOCK_OUT',
          timestamp: new Date().toISOString(),
          nsrNumber: 42,
          hasApproval: true,
          punchDeviceId: 'dev-1',
        },
      });
      await expect(punchPayrollConsumer.handle(event)).resolves.toBeUndefined();
    });
  });
});
