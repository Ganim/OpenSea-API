import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkplaceRisk } from '@/entities/hr/workplace-risk';
import { SafetyProgramsRepository } from '@/repositories/hr/safety-programs-repository';
import { WorkplaceRisksRepository } from '@/repositories/hr/workplace-risks-repository';

export interface CreateWorkplaceRiskRequest {
  tenantId: string;
  safetyProgramId: string;
  name: string;
  category: string;
  severity: string;
  source?: string;
  affectedArea?: string;
  controlMeasures?: string;
  epiRequired?: string;
}

export interface CreateWorkplaceRiskResponse {
  workplaceRisk: WorkplaceRisk;
}

export class CreateWorkplaceRiskUseCase {
  constructor(
    private workplaceRisksRepository: WorkplaceRisksRepository,
    private safetyProgramsRepository: SafetyProgramsRepository,
  ) {}

  async execute(
    request: CreateWorkplaceRiskRequest,
  ): Promise<CreateWorkplaceRiskResponse> {
    const {
      tenantId,
      safetyProgramId,
      name,
      category,
      severity,
      source,
      affectedArea,
      controlMeasures,
      epiRequired,
    } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('O nome do risco é obrigatório');
    }

    // Verify safety program exists
    const program = await this.safetyProgramsRepository.findById(
      new UniqueEntityID(safetyProgramId),
      tenantId,
    );

    if (!program) {
      throw new ResourceNotFoundError('Programa de segurança não encontrado');
    }

    const workplaceRisk = await this.workplaceRisksRepository.create({
      tenantId,
      safetyProgramId: new UniqueEntityID(safetyProgramId),
      name: name.trim(),
      category,
      severity,
      source: source?.trim(),
      affectedArea: affectedArea?.trim(),
      controlMeasures: controlMeasures?.trim(),
      epiRequired: epiRequired?.trim(),
    });

    return { workplaceRisk };
  }
}
