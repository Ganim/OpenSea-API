/**
 * Punch → Payroll stub consumer.
 *
 * Subscribes to `punch.time-entry.created` events and logs receipt.
 * The real payroll calculation (aggregation, overtime detection, etc.)
 * is implemented in phase 6/7 — this stub exists so the event chain is
 * exercised end-to-end in phase 4.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';

// Lazy logger to avoid @env initialization in unit tests
let _logger: {
  info: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
      };
    }
  }
  return _logger!;
}

export const punchPayrollConsumer: EventConsumer = {
  consumerId: 'punch.payroll-handler',
  moduleId: 'payroll',
  subscribesTo: [PUNCH_EVENTS.TIME_ENTRY_CREATED],

  async handle(event: DomainEvent): Promise<void> {
    getLogger().info(
      {
        eventId: event.id,
        timeEntryId: event.sourceEntityId,
        tenantId: event.tenantId,
      },
      '[PunchPayrollConsumer] STUB — evento recebido; cálculo real em fase 6/7',
    );
    // No-op: real work lands in phase 6/7 when payroll integration is wired.
  },
};
