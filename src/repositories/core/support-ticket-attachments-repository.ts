import type { SupportTicketAttachment } from '@/entities/core/support-ticket-attachment';

export interface SupportTicketAttachmentsRepository {
  findByTicketId(ticketId: string): Promise<SupportTicketAttachment[]>;
  create(attachment: SupportTicketAttachment): Promise<void>;
}
