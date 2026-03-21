import type { SupportTicketAttachment } from '@/entities/core/support-ticket-attachment';
import type { SupportTicketAttachmentsRepository } from '../support-ticket-attachments-repository';

export class InMemorySupportTicketAttachmentsRepository
  implements SupportTicketAttachmentsRepository
{
  public items: SupportTicketAttachment[] = [];

  async findByTicketId(ticketId: string): Promise<SupportTicketAttachment[]> {
    return this.items.filter((attachment) => attachment.ticketId === ticketId);
  }

  async create(attachment: SupportTicketAttachment): Promise<void> {
    this.items.push(attachment);
  }
}
