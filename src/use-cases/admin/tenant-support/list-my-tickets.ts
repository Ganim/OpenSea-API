import {
  type SupportTicketDTO,
  supportTicketToDTO,
} from '@/mappers/core/support-ticket-mapper';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface ListMyTicketsUseCaseRequest {
  tenantId: string;
  creatorId: string;
  page: number;
  perPage: number;
}

interface ListMyTicketsUseCaseResponse {
  tickets: SupportTicketDTO[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListMyTicketsUseCase {
  constructor(private supportTicketsRepository: SupportTicketsRepository) {}

  async execute({
    tenantId,
    creatorId,
    page,
    perPage,
  }: ListMyTicketsUseCaseRequest): Promise<ListMyTicketsUseCaseResponse> {
    const filters = { tenantId, creatorId };

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
