import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { InMemorySupportTicketMessagesRepository } from '@/repositories/core/in-memory/in-memory-support-ticket-messages-repository';
import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { beforeEach, describe, expect, it } from 'vitest';
import { RateTicketUseCase } from './rate-ticket';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let supportTicketMessagesRepository: InMemorySupportTicketMessagesRepository;
let sut: RateTicketUseCase;

describe('RateTicketUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    supportTicketMessagesRepository =
      new InMemorySupportTicketMessagesRepository();
    sut = new RateTicketUseCase(
      supportTicketsRepository,
      supportTicketMessagesRepository,
    );
  });

  it('should rate a resolved ticket', async () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({
        tenantId,
        creatorId: userId,
        status: 'RESOLVED',
      }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    const { success } = await sut.execute({
      ticketId,
      tenantId,
      userId,
      rating: 5,
      comment: 'Great support!',
    });

    expect(success).toBe(true);

    const messages =
      await supportTicketMessagesRepository.findByTicketId(ticketId);
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toContain('[RATING:5]');
    expect(messages[0].body).toContain('Great support!');
  });

  it('should throw ForbiddenError when ticket is not resolved', async () => {
    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({
        tenantId: 'tenant-1',
        creatorId: 'user-1',
        status: 'OPEN',
      }),
    );

    await expect(
      sut.execute({
        ticketId: createdTicket.supportTicketId.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        rating: 4,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ResourceNotFoundError when ticket does not exist', async () => {
    await expect(
      sut.execute({
        ticketId: 'nonexistent',
        tenantId: 'tenant-1',
        userId: 'user-1',
        rating: 3,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
