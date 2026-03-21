import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMyTicketsUseCase } from './list-my-tickets';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let sut: ListMyTicketsUseCase;

describe('ListMyTicketsUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    sut = new ListMyTicketsUseCase(supportTicketsRepository);
  });

  it('should list only tickets created by the current user', async () => {
    const tenantId = 'tenant-1';

    await supportTicketsRepository.create(
      makeSupportTicket({ tenantId, creatorId: 'user-1', title: 'My ticket' }),
    );
    await supportTicketsRepository.create(
      makeSupportTicket({
        tenantId,
        creatorId: 'user-2',
        title: 'Other ticket',
      }),
    );

    const { tickets, meta } = await sut.execute({
      tenantId,
      creatorId: 'user-1',
      page: 1,
      perPage: 20,
    });

    expect(tickets).toHaveLength(1);
    expect(tickets[0].title).toBe('My ticket');
    expect(meta.total).toBe(1);
  });

  it('should return empty when user has no tickets', async () => {
    const { tickets } = await sut.execute({
      tenantId: 'tenant-1',
      creatorId: 'user-1',
      page: 1,
      perPage: 20,
    });

    expect(tickets).toHaveLength(0);
  });
});
