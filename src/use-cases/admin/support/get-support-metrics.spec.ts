import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSupportMetricsUseCase } from './get-support-metrics';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let sut: GetSupportMetricsUseCase;

describe('GetSupportMetricsUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    sut = new GetSupportMetricsUseCase(supportTicketsRepository);
  });

  it('should return support metrics', async () => {
    await supportTicketsRepository.create(
      makeSupportTicket({ status: 'OPEN' }),
    );
    await supportTicketsRepository.create(
      makeSupportTicket({ status: 'OPEN' }),
    );
    await supportTicketsRepository.create(
      makeSupportTicket({ status: 'RESOLVED' }),
    );
    await supportTicketsRepository.create(
      makeSupportTicket({ status: 'CLOSED' }),
    );

    const metrics = await sut.execute();

    expect(metrics.totalTickets).toBe(4);
    expect(metrics.openTickets).toBe(2);
    expect(metrics.resolvedTickets).toBe(1);
    expect(metrics.closedTickets).toBe(1);
    expect(metrics.averageSatisfaction).toBeNull();
    expect(metrics.aiResolutionRate).toBeNull();
  });

  it('should return zero counts when no tickets exist', async () => {
    const metrics = await sut.execute();

    expect(metrics.totalTickets).toBe(0);
    expect(metrics.openTickets).toBe(0);
  });
});
