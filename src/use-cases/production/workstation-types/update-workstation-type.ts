import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkstationTypesRepository } from '@/repositories/production/workstation-types-repository';

interface UpdateWorkstationTypeUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
}

interface UpdateWorkstationTypeUseCaseResponse {
  workstationType: import('@/entities/production/workstation-type').ProductionWorkstationType;
}

export class UpdateWorkstationTypeUseCase {
  constructor(private workstationTypesRepository: WorkstationTypesRepository) {}

  async execute({
    tenantId,
    id,
    name,
    description,
    icon,
    color,
    isActive,
  }: UpdateWorkstationTypeUseCaseRequest): Promise<UpdateWorkstationTypeUseCaseResponse> {
    const workstationType = await this.workstationTypesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workstationType) {
      throw new ResourceNotFoundError('Workstation type not found.');
    }

    if (name && name !== workstationType.name) {
      const existingType = await this.workstationTypesRepository.findByName(
        name,
        tenantId,
      );

      if (existingType && !existingType.id.equals(workstationType.id)) {
        throw new BadRequestError(
          'A workstation type with this name already exists.',
        );
      }
    }

    const updatedWorkstationType = await this.workstationTypesRepository.update(
      {
        id: new UniqueEntityID(id),
        name,
        description,
        icon,
        color,
        isActive,
      },
    );

    if (!updatedWorkstationType) {
      throw new ResourceNotFoundError('Workstation type not found.');
    }

    return {
      workstationType: updatedWorkstationType,
    };
  }
}
