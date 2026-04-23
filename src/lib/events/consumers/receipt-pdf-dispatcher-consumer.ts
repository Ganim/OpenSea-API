/**
 * Receipt PDF → BullMQ dispatcher (Phase 06 / Plan 06-03).
 *
 * Bridge minimalista (Plan 04-05 pattern): subscreve
 * `PUNCH_EVENTS.TIME_ENTRY_CREATED` e enfileira 1 job na queue
 * `receipt-pdf-generation` com `jobId = timeEntryId`.
 *
 * BullMQ dedupa por jobId — replays do mesmo evento (retries do
 * TypedEventBus ou dupla emissão em uma rotação de processos) resultam em
 * no máximo 1 recibo gerado. Segunda camada de idempotência (content-level)
 * fica no próprio worker via `findFirst(ComplianceArtifact where filters.timeEntryId)`.
 *
 * Deliberadamente SEPARADO de `punch-events-queue-bridge.ts` (que fan-outs
 * todos os punch.* para `punch-events` queue) — o bridge geral é para
 * consumers fat-workers futuros (payroll, timebank, eSocial); o recibo
 * precisa de uma queue dedicada com prioridade mais alta e retry mais
 * agressivo para o SLO de < 5s do Plan 06-03.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { PUNCH_EVENTS, type PunchTimeEntryCreatedData } from '../punch-events';

import { addJob, QUEUE_NAMES } from '@/lib/queue';

export interface ReceiptPdfJobPayload {
  timeEntryId: string;
  tenantId: string;
}

// Logger lazy (Plan 04-05 pattern — evita @env init em unit specs).
let _logger: {
  info: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

export const receiptPdfDispatcherConsumer: EventConsumer = {
  consumerId: 'compliance.receipt-pdf-dispatcher',
  moduleId: 'compliance',
  subscribesTo: [PUNCH_EVENTS.TIME_ENTRY_CREATED],

  async handle(event: DomainEvent): Promise<void> {
    // Guard — subscribesTo já filtra no bus, mas defesa-em-profundidade.
    if (event.type !== PUNCH_EVENTS.TIME_ENTRY_CREATED) return;

    const data = event.data as unknown as PunchTimeEntryCreatedData;

    if (!data.timeEntryId || !event.tenantId) {
      getLogger().error(
        { eventId: event.id, data },
        '[receiptPdfDispatcher] payload sem timeEntryId ou tenantId — skip',
      );
      return;
    }

    try {
      await addJob<ReceiptPdfJobPayload>(
        QUEUE_NAMES.RECEIPT_PDF,
        {
          timeEntryId: data.timeEntryId,
          tenantId: event.tenantId,
        },
        {
          // Dedupe por BullMQ: mesmo timeEntryId → apenas um job efetivo.
          // Previne duplicatas em caso de retry do typedEventBus ou replay
          // do BullMQ bridge geral (punch-events-queue-bridge).
          jobId: data.timeEntryId,
        },
      );
    } catch (err) {
      getLogger().error(
        {
          eventId: event.id,
          timeEntryId: data.timeEntryId,
          tenantId: event.tenantId,
          error: err instanceof Error ? err.message : String(err),
        },
        '[receiptPdfDispatcher] Falha ao enfileirar job',
      );
      throw err; // typedEventBus re-tenta com backoff
    }
  },
};
