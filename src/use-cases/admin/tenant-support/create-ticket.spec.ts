import { InMemorySupportTicketMessagesRepository } from '@/repositories/core/in-memory/in-memory-support-ticket-messages-repository';
import { InMemorySupportTicketsRepository } from '@/repositories/core/in-memory/in-memory-support-tickets-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTicketUseCase } from './create-ticket';

let supportTicketsRepository: InMemorySupportTicketsRepository;
let supportTicketMessagesRepository: InMemorySupportTicketMessagesRepository;
let sut: CreateTicketUseCase;

describe('CreateTicketUseCase', () => {
  beforeEach(() => {
    supportTicketsRepository = new InMemorySupportTicketsRepository();
    supportTicketMessagesRepository =
      new InMemorySupportTicketMessagesRepository();
    sut = new CreateTicketUseCase(
      supportTicketsRepository,
      supportTicketMessagesRepository,
    );
  });

  it('should create a support ticket with an initial message', async () => {
    const { ticket } = await sut.execute({
      tenantId: 'tenant-1',
      creatorId: 'user-1',
      title: 'Cannot access my dashboard',
      description: 'I am getting a 500 error when opening the dashboard.',
      category: 'BUG',
    });

    expect(ticket.title).toBe('Cannot access my dashboard');
    expect(ticket.category).toBe('BUG');
    expect(ticket.status).toBe('OPEN');
    expect(ticket.tenantId).toBe('tenant-1');
    expect(ticket.creatorId).toBe('user-1');

    // The initial message should be created
    const messages = await supportTicketMessagesRepository.findByTicketId(
      ticket.id,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toBe(
      'I am getting a 500 error when opening the dashboard.',
    );
    expect(messages[0].authorType).toBe('TENANT_USER');
  });

  it('should default category to OTHER if not specified', async () => {
    const { ticket } = await sut.execute({
      tenantId: 'tenant-1',
      creatorId: 'user-1',
      title: 'General question',
      description: 'How do I export data?',
    });

    expect(ticket.category).toBe('OTHER');
  });
});
