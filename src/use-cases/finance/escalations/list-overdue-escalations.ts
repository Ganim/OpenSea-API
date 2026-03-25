import {
  type OverdueEscalationDTO,
  overdueEscalationToDTO,
} from '@/mappers/finance/overdue-escalation/overdue-escalation-to-dto';
import type { OverdueEscalationsRepository } from '@/repositories/finance/overdue-escalations-repository';

interface ListOverdueEscalationsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

interface ListOverdueEscalationsUseCaseResponse {
  escalations: OverdueEscalationDTO[];
  total: number;
}

export class ListOverdueEscalationsUseCase {
  constructor(private escalationsRepository: OverdueEscalationsRepository) {}

  async execute(
    request: ListOverdueEscalationsUseCaseRequest,
  ): Promise<ListOverdueEscalationsUseCaseResponse> {
    const { tenantId, page, limit, isActive } = request;

    const { escalations, total } = await this.escalationsRepository.findMany({
      tenantId,
      page,
      limit,
      isActive,
    });

    return {
      escalations: escalations.map(overdueEscalationToDTO),
      total,
    };
  }
}
