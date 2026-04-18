/**
 * Punch → Timebank stub consumer.
 *
 * Subscribes to `punch.time-entry.created` events and logs receipt.
 * The real timebank recompute logic (accrued hours, overtime banking,
 * compensation windows) is implemented in phase 7 — this stub exists so
 * the event chain is exercised end-to-end in phase 4.
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

export const punchTimebankConsumer: EventConsumer = {
  consumerId: 'punch.timebank-handler',
  moduleId: 'timebank',
  subscribesTo: [PUNCH_EVENTS.TIME_ENTRY_CREATED],

  async handle(event: DomainEvent): Promise<void> {
    getLogger().info(
      {
        eventId: event.id,
        timeEntryId: event.sourceEntityId,
        tenantId: event.tenantId,
      },
      '[PunchTimebankConsumer] STUB — evento recebido; recálculo de banco de horas em fase 7',
    );
    // No-op: real work lands in phase 7 when timebank integration is wired.
  },
};
