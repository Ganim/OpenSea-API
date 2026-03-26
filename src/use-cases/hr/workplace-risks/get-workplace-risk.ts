import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkplaceRisk } from '@/entities/hr/workplace-risk';
import { WorkplaceRisksRepository } from '@/repositories/hr/workplace-risks-repository';

export interface GetWorkplaceRiskRequest {
  tenantId: string;
  riskId: string;
}

export interface GetWorkplaceRiskResponse {
  workplaceRisk: WorkplaceRisk;
}

export class GetWorkplaceRiskUseCase {
  constructor(private workplaceRisksRepository: WorkplaceRisksRepository) {}

  async execute(
    request: GetWorkplaceRiskRequest,
  ): Promise<GetWorkplaceRiskResponse> {
    const { tenantId, riskId } = request;

    const workplaceRisk = await this.workplaceRisksRepository.findById(
      new UniqueEntityID(riskId),
      tenantId,
    );

    if (!workplaceRisk) {
      throw new ResourceNotFoundError('Risco ocupacional não encontrado');
    }

    return { workplaceRisk };
  }
}
