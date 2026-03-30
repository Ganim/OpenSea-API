import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OccupationalExamRequirementsRepository } from '@/repositories/hr/occupational-exam-requirements-repository';

export interface DeleteExamRequirementRequest {
  tenantId: string;
  requirementId: string;
}

export class DeleteExamRequirementUseCase {
  constructor(
    private examRequirementsRepository: OccupationalExamRequirementsRepository,
  ) {}

  async execute(request: DeleteExamRequirementRequest): Promise<void> {
    const { tenantId, requirementId } = request;

    const existing = await this.examRequirementsRepository.findById(
      new UniqueEntityID(requirementId),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError(
        'Requisito de exame ocupacional não encontrado',
      );
    }

    await this.examRequirementsRepository.delete(
      new UniqueEntityID(requirementId),
    );
  }
}
