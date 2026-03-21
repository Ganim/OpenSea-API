import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySupportTicketAttachmentsRepository } from '@/repositories/core/in-memory/in-memory-support-ticket-attachments-repository';
import { InMemorySupportTicketMessagesRepository } from '@/repositories/core/in-memory/in-memory-support-ticket-messages-repository';
import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { makeSupportTicketMessage } from '@/utils/tests/factories/core/make-support-ticket-message';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTicketUseCase } from './get-ticket';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let supportTicketMessagesRepository: InMemorySupportTicketMessagesRepository;
let supportTicketAttachmentsRepository: InMemorySupportTicketAttachmentsRepository;
let sut: GetTicketUseCase;

describe('GetTicketUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    supportTicketMessagesRepository =
      new InMemorySupportTicketMessagesRepository();
    supportTicketAttachmentsRepository =
      new InMemorySupportTicketAttachmentsRepository();
    sut = new GetTicketUseCase(
      supportTicketsRepository,
      supportTicketMessagesRepository,
      supportTicketAttachmentsRepository,
    );
  });

  it('should get a ticket with messages and attachments', async () => {
    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ title: 'Bug report' }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    await supportTicketMessagesRepository.create(
      makeSupportTicketMessage({ ticketId, body: 'First message' }),
    );

    const { ticket, messages, attachments } = await sut.execute({ ticketId });

    expect(ticket.title).toBe('Bug report');
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toBe('First message');
    expect(attachments).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError when ticket does not exist', async () => {
    await expect(
      sut.execute({ ticketId: 'nonexistent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
