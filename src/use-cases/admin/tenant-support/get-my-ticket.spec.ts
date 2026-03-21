import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { InMemorySupportTicketAttachmentsRepository } from '@/repositories/core/in-memory/in-memory-support-ticket-attachments-repository';
import { InMemorySupportTicketMessagesRepository } from '@/repositories/core/in-memory/in-memory-support-ticket-messages-repository';
import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { makeSupportTicketMessage } from '@/utils/tests/factories/core/make-support-ticket-message';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetMyTicketUseCase } from './get-my-ticket';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let supportTicketMessagesRepository: InMemorySupportTicketMessagesRepository;
let supportTicketAttachmentsRepository: InMemorySupportTicketAttachmentsRepository;
let sut: GetMyTicketUseCase;

describe('GetMyTicketUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    supportTicketMessagesRepository =
      new InMemorySupportTicketMessagesRepository();
    supportTicketAttachmentsRepository =
      new InMemorySupportTicketAttachmentsRepository();
    sut = new GetMyTicketUseCase(
      supportTicketsRepository,
      supportTicketMessagesRepository,
      supportTicketAttachmentsRepository,
    );
  });

  it('should get ticket details excluding internal messages', async () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ tenantId, creatorId: userId }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    await supportTicketMessagesRepository.create(
      makeSupportTicketMessage({ ticketId, body: 'Public message' }),
    );
    await supportTicketMessagesRepository.create(
      makeSupportTicketMessage({
        ticketId,
        body: 'Internal note',
        isInternal: true,
      }),
    );

    const { ticket, messages } = await sut.execute({
      ticketId,
      tenantId,
      userId,
    });

    expect(ticket).toBeTruthy();
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toBe('Public message');
  });

  it('should throw ForbiddenError when ticket belongs to another tenant', async () => {
    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ tenantId: 'tenant-1', creatorId: 'user-1' }),
    );

    await expect(
      sut.execute({
        ticketId: createdTicket.supportTicketId.toString(),
        tenantId: 'tenant-2',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ResourceNotFoundError when ticket does not exist', async () => {
    await expect(
      sut.execute({
        ticketId: 'nonexistent',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
