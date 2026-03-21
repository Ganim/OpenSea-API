import {
  type SupportTicketDTO,
  supportTicketToDTO,
} from '@/mappers/core/support-ticket-mapper';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface ListTicketsUseCaseRequest {
  page: number;
  perPage: number;
  tenantId?: string;
  status?: string;
  priority?: string;
  category?: string;
  assigneeId?: string;
  search?: string;
}

interface ListTicketsUseCaseResponse {
  tickets: SupportTicketDTO[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListTicketsUseCase {
  constructor(private supportTicketsRepository: SupportTicketsRepository) {}

  async execute({
    page,
    perPage,
    tenantId,
    status,
    priority,
    category,
    assigneeId,
    search,
  }: ListTicketsUseCaseRequest): Promise<ListTicketsUseCaseResponse> {
    const filters = {
      tenantId,
      status,
      priority,
      category,
      assigneeId,
      search,
    };

    const [allTickets, totalTickets] = await Promise.all([
      this.supportTicketsRepository.findMany(page, perPage, filters),
      this.supportTicketsRepository.countAll(filters),
    ]);

    const totalPages = Math.ceil(totalTickets / perPage);

    return {
      tickets: allTickets.map(supportTicketToDTO),
      meta: {
        total: totalTickets,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
