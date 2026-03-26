import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkplaceRisk } from '@/entities/hr/workplace-risk';
import { WorkplaceRisksRepository } from '@/repositories/hr/workplace-risks-repository';

export interface ListWorkplaceRisksRequest {
  tenantId: string;
  safetyProgramId?: string;
  category?: string;
  severity?: string;
  isActive?: boolean;
  page?: number;
  perPage?: number;
}

export interface ListWorkplaceRisksResponse {
  workplaceRisks: WorkplaceRisk[];
}

export class ListWorkplaceRisksUseCase {
  constructor(private workplaceRisksRepository: WorkplaceRisksRepository) {}

  async execute(
    request: ListWorkplaceRisksRequest,
  ): Promise<ListWorkplaceRisksResponse> {
    const { tenantId, safetyProgramId, category, severity, isActive, page, perPage } = request;

    const workplaceRisks = await this.workplaceRisksRepository.findMany(
      tenantId,
      {
        safetyProgramId: safetyProgramId ? new UniqueEntityID(safetyProgramId) : undefined,
        category,
        severity,
        isActive,
        page,
        perPage,
      },
    );

    return { workplaceRisks };
  }
}
