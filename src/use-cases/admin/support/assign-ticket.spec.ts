import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { makeSupportTicket } from '@/utils/tests/factories/core/make-support-ticket';
import { beforeEach, describe, expect, it } from 'vitest';
import { AssignTicketUseCase } from './assign-ticket';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let sut: AssignTicketUseCase;

describe('AssignTicketUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    sut = new AssignTicketUseCase(supportTicketsRepository);
  });

  it('should assign a ticket to a team member', async () => {
    const createdTicket = await supportTicketsRepository.create(
      makeSupportTicket({ status: 'OPEN' }),
    );

    const ticketId = createdTicket.supportTicketId.toString();

    const { ticket } = await sut.execute({
      ticketId,
      assigneeId: 'assignee-1',
    });

    expect(ticket.assigneeId).toBe('assignee-1');
    expect(ticket.status).toBe('IN_PROGRESS');
  });

  it('should throw ResourceNotFoundError when ticket does not exist', async () => {
    await expect(
      sut.execute({ ticketId: 'nonexistent', assigneeId: 'assignee-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
