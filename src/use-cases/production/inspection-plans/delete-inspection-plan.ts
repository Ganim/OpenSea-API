import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InspectionPlansRepository } from '@/repositories/production/inspection-plans-repository';

interface DeleteInspectionPlanUseCaseRequest {
  inspectionPlanId: string;
}

export class DeleteInspectionPlanUseCase {
  constructor(private inspectionPlansRepository: InspectionPlansRepository) {}

  async execute({
    inspectionPlanId,
  }: DeleteInspectionPlanUseCaseRequest): Promise<void> {
    const existing = await this.inspectionPlansRepository.findById(
      new UniqueEntityID(inspectionPlanId),
    );

    if (!existing) {
      throw new ResourceNotFoundError('Inspection plan not found.');
    }

    await this.inspectionPlansRepository.delete(
      new UniqueEntityID(inspectionPlanId),
    );
  }
}
