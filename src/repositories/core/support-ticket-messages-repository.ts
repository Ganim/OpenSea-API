import type { SupportTicketMessage } from '@/entities/core/support-ticket-message';

export interface SupportTicketMessagesRepository {
  findByTicketId(ticketId: string): Promise<SupportTicketMessage[]>;
  create(message: SupportTicketMessage): Promise<void>;
}
