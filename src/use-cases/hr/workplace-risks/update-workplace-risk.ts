import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkplaceRisk } from '@/entities/hr/workplace-risk';
import { WorkplaceRisksRepository } from '@/repositories/hr/workplace-risks-repository';

export interface UpdateWorkplaceRiskRequest {
  tenantId: string;
  riskId: string;
  name?: string;
  category?: string;
  severity?: string;
  source?: string;
  affectedArea?: string;
  controlMeasures?: string;
  epiRequired?: string;
  isActive?: boolean;
}

export interface UpdateWorkplaceRiskResponse {
  workplaceRisk: WorkplaceRisk;
}

export class UpdateWorkplaceRiskUseCase {
  constructor(private workplaceRisksRepository: WorkplaceRisksRepository) {}

  async execute(
    request: UpdateWorkplaceRiskRequest,
  ): Promise<UpdateWorkplaceRiskResponse> {
    const { tenantId, riskId, ...data } = request;

    const existing = await this.workplaceRisksRepository.findById(
      new UniqueEntityID(riskId),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Risco ocupacional não encontrado');
    }

    const workplaceRisk = await this.workplaceRisksRepository.update({
      id: new UniqueEntityID(riskId),
      name: data.name?.trim(),
      category: data.category,
      severity: data.severity,
      source: data.source?.trim(),
      affectedArea: data.affectedArea?.trim(),
      controlMeasures: data.controlMeasures?.trim(),
      epiRequired: data.epiRequired?.trim(),
      isActive: data.isActive,
    });

    if (!workplaceRisk) {
      throw new ResourceNotFoundError('Risco ocupacional não encontrado');
    }

    return { workplaceRisk };
  }
}
