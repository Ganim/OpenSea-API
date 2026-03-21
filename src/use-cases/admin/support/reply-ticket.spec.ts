import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySupportTicketMessagesRepository } from '@/repositories/core/in-memory/in-memory-support-ticket-messages-repository';
import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReplyTicketUseCase } from './reply-ticket';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let supportTicketMessagesRepository: InMemorySupportTicketMessagesRepository;
let sut: ReplyTicketUseCase;

describe('ReplyTicketUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    supportTicketMessagesRepository =
      new InMemorySupportTicketMessagesRepository();
    sut = new ReplyTicketUseCase(
      supportTicketsRepository,
      supportTicketMessagesRepository,
    );
  });

  it('should add a reply message to a ticket', async () => {
    const createdTicket =
      await supportTicketsRepository.create(makeSupportTicket());

    const ticketId = createdTicket.supportTicketId.toString();

    const { message } = await sut.execute({
      ticketId,
      authorId: 'admin-user-1',
      body: 'We are investigating the issue.',
      isInternal: false,
    });

    expect(message.body).toBe('We are investigating the issue.');
    expect(message.authorType).toBe('CENTRAL_TEAM');
    expect(message.isInternal).toBe(false);
  });

  it('should create an internal note', async () => {
    const createdTicket =
      await supportTicketsRepository.create(makeSupportTicket());

    const ticketId = createdTicket.supportTicketId.toString();

    const { message } = await sut.execute({
      ticketId,
      authorId: 'admin-user-1',
      body: 'Internal note for the team.',
      isInternal: true,
    });

    expect(message.isInternal).toBe(true);
  });

  it('should throw ResourceNotFoundError when ticket does not exist', async () => {
    await expect(
      sut.execute({
        ticketId: 'nonexistent',
        authorId: 'admin-user-1',
        body: 'Reply',
        isInternal: false,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
