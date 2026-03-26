import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkplaceRisk } from '@/entities/hr/workplace-risk';
import { WorkplaceRisksRepository } from '@/repositories/hr/workplace-risks-repository';

export interface DeleteWorkplaceRiskRequest {
  tenantId: string;
  riskId: string;
}

export interface DeleteWorkplaceRiskResponse {
  workplaceRisk: WorkplaceRisk;
}

export class DeleteWorkplaceRiskUseCase {
  constructor(private workplaceRisksRepository: WorkplaceRisksRepository) {}

  async execute(
    request: DeleteWorkplaceRiskRequest,
  ): Promise<DeleteWorkplaceRiskResponse> {
    const { tenantId, riskId } = request;

    const workplaceRisk = await this.workplaceRisksRepository.findById(
      new UniqueEntityID(riskId),
      tenantId,
    );

    if (!workplaceRisk) {
      throw new ResourceNotFoundError('Risco ocupacional não encontrado');
    }

    await this.workplaceRisksRepository.delete(new UniqueEntityID(riskId));

    return { workplaceRisk };
  }
}
