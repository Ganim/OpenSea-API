import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InspectionPlansRepository } from '@/repositories/production/inspection-plans-repository';

interface UpdateInspectionPlanUseCaseRequest {
  inspectionPlanId: string;
  inspectionType?: string;
  description?: string | null;
  sampleSize?: number;
  aqlLevel?: string | null;
  instructions?: string | null;
  isActive?: boolean;
}

interface UpdateInspectionPlanUseCaseResponse {
  inspectionPlan: import('@/entities/production/inspection-plan').ProductionInspectionPlan;
}

export class UpdateInspectionPlanUseCase {
  constructor(private inspectionPlansRepository: InspectionPlansRepository) {}

  async execute({
    inspectionPlanId,
    ...data
  }: UpdateInspectionPlanUseCaseRequest): Promise<UpdateInspectionPlanUseCaseResponse> {
    const existing = await this.inspectionPlansRepository.findById(
      new UniqueEntityID(inspectionPlanId),
    );

    if (!existing) {
      throw new ResourceNotFoundError('Inspection plan not found.');
    }

    const inspectionPlan = await this.inspectionPlansRepository.update({
      id: new UniqueEntityID(inspectionPlanId),
      ...data,
    });

    if (!inspectionPlan) {
      throw new ResourceNotFoundError('Inspection plan not found.');
    }

    return { inspectionPlan };
  }
}
