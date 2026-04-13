import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { WorkstationTypesRepository } from '@/repositories/production/workstation-types-repository';

interface CreateWorkstationTypeUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

interface CreateWorkstationTypeUseCaseResponse {
  workstationType: import('@/entities/production/workstation-type').ProductionWorkstationType;
}

export class CreateWorkstationTypeUseCase {
  constructor(private workstationTypesRepository: WorkstationTypesRepository) {}

  async execute({
    tenantId,
    name,
    description,
    icon,
    color,
    isActive = true,
  }: CreateWorkstationTypeUseCaseRequest): Promise<CreateWorkstationTypeUseCaseResponse> {
    const existingType = await this.workstationTypesRepository.findByName(
      name,
      tenantId,
    );

    if (existingType) {
      throw new BadRequestError(
        'A workstation type with this name already exists.',
      );
    }

    const workstationType = await this.workstationTypesRepository.create({
      tenantId,
      name,
      description,
      icon,
      color,
      isActive,
    });

    return {
      workstationType,
    };
  }
}
