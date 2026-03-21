import type { SupportTicket } from '@/entities/core/support-ticket';

export interface SupportTicketFilters {
  tenantId?: string;
  status?: string;
  priority?: string;
  category?: string;
  assigneeId?: string;
  creatorId?: string;
  search?: string;
}

export interface SupportTicketsRepository {
  findById(ticketId: string): Promise<SupportTicket | null>;
  findMany(
    page: number,
    perPage: number,
    filters?: SupportTicketFilters,
  ): Promise<SupportTicket[]>;
  countAll(filters?: SupportTicketFilters): Promise<number>;
  create(ticket: SupportTicket): Promise<SupportTicket>;
  save(ticket: SupportTicket): Promise<void>;
}
