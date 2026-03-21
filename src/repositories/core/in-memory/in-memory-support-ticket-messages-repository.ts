import type { SupportTicketMessage } from '@/entities/core/support-ticket-message';
import type { SupportTicketMessagesRepository } from '../support-ticket-messages-repository';

export class InMemorySupportTicketMessagesRepository
  implements SupportTicketMessagesRepository
{
  public items: SupportTicketMessage[] = [];

  async findByTicketId(ticketId: string): Promise<SupportTicketMessage[]> {
    return this.items
      .filter((message) => message.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async create(message: SupportTicketMessage): Promise<void> {
    this.items.push(message);
  }
}
