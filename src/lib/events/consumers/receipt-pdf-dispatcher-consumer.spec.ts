import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks (Plan 04-05 pattern — captura de ref antes do vi.mock hoist).
const { addJobMock } = vi.hoisted(() => ({
  addJobMock: vi.fn().mockResolvedValue({ id: 'job-1' }),
}));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: { RECEIPT_PDF: 'receipt-pdf-generation' },
  addJob: addJobMock,
}));

vi.mock('@/@env', () => ({ env: { NODE_ENV: 'test' } }));

import type { DomainEvent } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';

import { receiptPdfDispatcherConsumer } from './receipt-pdf-dispatcher-consumer';

function makeEvent(
  partial: Partial<DomainEvent> = {},
  dataOverride?: Record<string, unknown>,
): DomainEvent {
  return {
    id: 'event-123',
    type: PUNCH_EVENTS.TIME_ENTRY_CREATED,
    version: 1,
    tenantId: 'tenant-abc',
    source: 'punch',
    sourceEntityType: 'time-entry',
    sourceEntityId: 'te-1',
    data: dataOverride ?? {
      timeEntryId: 'te-1',
      employeeId: 'emp-1',
      entryType: 'CLOCK_IN',
      timestamp: '2026-03-15T11:02:00Z',
      nsrNumber: 1234,
      hasApproval: false,
      punchDeviceId: null,
    },
    timestamp: '2026-03-15T11:02:00Z',
    ...partial,
  };
}

describe('receiptPdfDispatcherConsumer', () => {
  beforeEach(() => {
    addJobMock.mockClear();
  });

  it('consumerId e moduleId corretos', () => {
    expect(receiptPdfDispatcherConsumer.consumerId).toBe(
      'compliance.receipt-pdf-dispatcher',
    );
    expect(receiptPdfDispatcherConsumer.moduleId).toBe('compliance');
  });

  it('subscreve apenas TIME_ENTRY_CREATED', () => {
    expect(receiptPdfDispatcherConsumer.subscribesTo).toEqual([
      PUNCH_EVENTS.TIME_ENTRY_CREATED,
    ]);
  });

  it('enfileira job com jobId = timeEntryId para dedupe', async () => {
    const event = makeEvent();
    await receiptPdfDispatcherConsumer.handle(event);

    expect(addJobMock).toHaveBeenCalledTimes(1);
    const [queueName, payload, opts] = addJobMock.mock.calls[0];
    expect(queueName).toBe('receipt-pdf-generation');
    expect(payload).toEqual({ timeEntryId: 'te-1', tenantId: 'tenant-abc' });
    expect(opts).toMatchObject({ jobId: 'te-1' });
  });

  it('guard: ignora eventos de tipo diferente (defesa-em-profundidade)', async () => {
    const event = makeEvent({ type: 'punch.device.paired' });
    await receiptPdfDispatcherConsumer.handle(event);
    expect(addJobMock).not.toHaveBeenCalled();
  });

  it('skip silencioso quando timeEntryId ausente', async () => {
    const event = makeEvent({}, {});
    await receiptPdfDispatcherConsumer.handle(event);
    expect(addJobMock).not.toHaveBeenCalled();
  });

  it('propaga erro de addJob para typedEventBus re-tentar', async () => {
    addJobMock.mockRejectedValueOnce(new Error('redis down'));
    await expect(
      receiptPdfDispatcherConsumer.handle(makeEvent()),
    ).rejects.toThrow('redis down');
  });

  it('replay idempotency: dois eventos com mesmo timeEntryId → mesmos params (BullMQ dedupa server-side)', async () => {
    await receiptPdfDispatcherConsumer.handle(makeEvent({ id: 'event-1' }));
    await receiptPdfDispatcherConsumer.handle(makeEvent({ id: 'event-2' }));
    // 2 chamadas a addJob, mas ambas com mesmo jobId. BullMQ em produção
    // dedupa pelo jobId e garante apenas um job efetivo; o consumer cumpre
    // seu papel ao passar o jobId consistente.
    expect(addJobMock).toHaveBeenCalledTimes(2);
    expect(addJobMock.mock.calls[0][2]?.jobId).toBe('te-1');
    expect(addJobMock.mock.calls[1][2]?.jobId).toBe('te-1');
  });
});
