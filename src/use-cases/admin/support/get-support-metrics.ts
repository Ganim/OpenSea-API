import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface GetSupportMetricsUseCaseResponse {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageSatisfaction: number | null;
  aiResolutionRate: number | null;
}

export class GetSupportMetricsUseCase {
  constructor(private supportTicketsRepository: SupportTicketsRepository) {}

  async execute(): Promise<GetSupportMetricsUseCaseResponse> {
    const [totalTickets, openTickets, resolvedTickets, closedTickets] =
      await Promise.all([
        this.supportTicketsRepository.countAll(),
        this.supportTicketsRepository.countAll({ status: 'OPEN' }),
        this.supportTicketsRepository.countAll({ status: 'RESOLVED' }),
        this.supportTicketsRepository.countAll({ status: 'CLOSED' }),
      ]);

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      // Placeholder: will be implemented when satisfaction rating is stored on tickets
      averageSatisfaction: null,
      // Placeholder: will be implemented when AI resolution tracking is added
      aiResolutionRate: null,
    };
  }
}
