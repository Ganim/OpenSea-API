import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTicketsUseCase } from './list-tickets';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let sut: ListTicketsUseCase;

describe('ListTicketsUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    sut = new ListTicketsUseCase(supportTicketsRepository);
  });

  it('should list all tickets with pagination', async () => {
    const tenantId = 'tenant-1';
    await supportTicketsRepository.create(
      makeSupportTicket({ tenantId, title: 'Ticket A' }),
    );
    await supportTicketsRepository.create(
      makeSupportTicket({ tenantId, title: 'Ticket B' }),
    );
    await supportTicketsRepository.create(
      makeSupportTicket({ tenantId, title: 'Ticket C' }),
    );

    const { tickets, meta } = await sut.execute({ page: 1, perPage: 2 });

    expect(tickets).toHaveLength(2);
    expect(meta.total).toBe(3);
    expect(meta.totalPages).toBe(2);
  });

  it('should filter tickets by status', async () => {
    await supportTicketsRepository.create(
      makeSupportTicket({ status: 'OPEN' }),
    );
    await supportTicketsRepository.create(
      makeSupportTicket({ status: 'RESOLVED' }),
    );

    const { tickets } = await sut.execute({
      page: 1,
      perPage: 20,
      status: 'OPEN',
    });

    expect(tickets).toHaveLength(1);
    expect(tickets[0].status).toBe('OPEN');
  });

  it('should filter tickets by tenantId', async () => {
    await supportTicketsRepository.create(
      makeSupportTicket({ tenantId: 'tenant-1' }),
    );
    await supportTicketsRepository.create(
      makeSupportTicket({ tenantId: 'tenant-2' }),
    );

    const { tickets } = await sut.execute({
      page: 1,
      perPage: 20,
      tenantId: 'tenant-1',
    });

    expect(tickets).toHaveLength(1);
    expect(tickets[0].tenantId).toBe('tenant-1');
  });

  it('should return empty list when no tickets exist', async () => {
    const { tickets, meta } = await sut.execute({ page: 1, perPage: 20 });
    expect(tickets).toHaveLength(0);
    expect(meta.total).toBe(0);
  });
});
