import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { InMemorySupportTicketMessagesRepository } from '@/repositories/core/in-memory/in-memory-support-ticket-messages-repository';
import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReplyMyTicketUseCase } from './reply-my-ticket';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let supportTicketMessagesRepository: InMemorySupportTicketMessagesRepository;
let sut: ReplyMyTicketUseCase;

describe('ReplyMyTicketUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    supportTicketMessagesRepository =
      new InMemorySupportTicketMessagesRepository();
    sut = new ReplyMyTicketUseCase(
      supportTicketsRepository,
      supportTicketMessagesRepository,
    );
  });

  it('should add a reply to own ticket', async () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ tenantId, creatorId: userId }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    const { message } = await sut.execute({
      ticketId,
      tenantId,
      userId,
      body: 'Here is more information.',
    });

    expect(message.body).toBe('Here is more information.');
    expect(message.authorType).toBe('TENANT_USER');
  });

  it('should reopen ticket when replying to a WAITING_CLIENT ticket', async () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({
        tenantId,
        creatorId: userId,
        status: 'WAITING_CLIENT',
      }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    await sut.execute({ ticketId, tenantId, userId, body: 'Reply' });

    const updatedTicket = await supportTicketsRepository.findById(ticketId);
    expect(updatedTicket?.status).toBe('OPEN');
  });

  it('should throw ForbiddenError when ticket belongs to another user', async () => {
    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ tenantId: 'tenant-1', creatorId: 'user-1' }),
    );

    await expect(
      sut.execute({
        ticketId: createdTicket.supportTicketId.toString(),
        tenantId: 'tenant-1',
        userId: 'user-2',
        body: 'Reply',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ResourceNotFoundError when ticket does not exist', async () => {
    await expect(
      sut.execute({
        ticketId: 'nonexistent',
        tenantId: 'tenant-1',
        userId: 'user-1',
        body: 'Reply',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
