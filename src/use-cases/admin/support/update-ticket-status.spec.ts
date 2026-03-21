import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateTicketStatusUseCase } from './update-ticket-status';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let sut: UpdateTicketStatusUseCase;

describe('UpdateTicketStatusUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    sut = new UpdateTicketStatusUseCase(supportTicketsRepository);
  });

  it('should update ticket status to IN_PROGRESS', async () => {
    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ status: 'OPEN' }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    const { ticket } = await sut.execute({
      ticketId,
      status: 'IN_PROGRESS',
    });

    expect(ticket.status).toBe('IN_PROGRESS');
  });

  it('should set resolvedAt when status changes to RESOLVED', async () => {
    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ status: 'IN_PROGRESS' }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    const { ticket } = await sut.execute({
      ticketId,
      status: 'RESOLVED',
    });

    expect(ticket.status).toBe('RESOLVED');
    expect(ticket.resolvedAt).toBeTruthy();
  });

  it('should set closedAt when status changes to CLOSED', async () => {
    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ status: 'RESOLVED' }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    const { ticket } = await sut.execute({
      ticketId,
      status: 'CLOSED',
    });

    expect(ticket.status).toBe('CLOSED');
    expect(ticket.closedAt).toBeTruthy();
  });

  it('should throw ResourceNotFoundError when ticket does not exist', async () => {
    await expect(
      sut.execute({ ticketId: 'nonexistent', status: 'CLOSED' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
