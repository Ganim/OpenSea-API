import type { SupportTicket } from '@/entities/core/support-ticket';
import type {
  SupportTicketFilters,
  SupportTicketsRepository,
} from '../support-tickets-repository';

export class InMemorySupportTicketsRepository
  implements SupportTicketsRepository
{
  public items: SupportTicket[] = [];
  private autoIncrementCounter = 0;

  async findById(ticketId: string): Promise<SupportTicket | null> {
    const ticket = this.items.find(
      (ticket) => ticket.supportTicketId.toString() === ticketId,
    );
    return ticket ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    filters?: SupportTicketFilters,
  ): Promise<SupportTicket[]> {
    const filteredTickets = this.applyFilters(this.items, filters);

    filteredTickets.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const startIndex = (page - 1) * perPage;
    return filteredTickets.slice(startIndex, startIndex + perPage);
  }

  async countAll(filters?: SupportTicketFilters): Promise<number> {
    return this.applyFilters(this.items, filters).length;
  }

  async create(ticket: SupportTicket): Promise<SupportTicket> {
    this.autoIncrementCounter++;
    ticket.props.ticketNumber = this.autoIncrementCounter;
    this.items.push(ticket);
    return ticket;
  }

  async save(ticket: SupportTicket): Promise<void> {
    const index = this.items.findIndex((existingTicket) =>
      existingTicket.id.equals(ticket.id),
    );
    if (index !== -1) {
      this.items[index] = ticket;
    }
  }

  private applyFilters(
    tickets: SupportTicket[],
    filters?: SupportTicketFilters,
  ): SupportTicket[] {
    if (!filters) return [...tickets];

    return tickets.filter((ticket) => {
      if (filters.tenantId && ticket.tenantId !== filters.tenantId)
        return false;
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.priority && ticket.priority !== filters.priority)
        return false;
      if (filters.category && ticket.category !== filters.category)
        return false;
      if (filters.assigneeId && ticket.assigneeId !== filters.assigneeId)
        return false;
      if (filters.creatorId && ticket.creatorId !== filters.creatorId)
        return false;
      if (
        filters.search &&
        !ticket.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
  }
}
