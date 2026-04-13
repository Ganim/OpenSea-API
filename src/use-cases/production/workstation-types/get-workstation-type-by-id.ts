import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkstationTypesRepository } from '@/repositories/production/workstation-types-repository';

interface GetWorkstationTypeByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetWorkstationTypeByIdUseCaseResponse {
  workstationType: import('@/entities/production/workstation-type').ProductionWorkstationType;
}

export class GetWorkstationTypeByIdUseCase {
  constructor(private workstationTypesRepository: WorkstationTypesRepository) {}

  async execute({
    tenantId,
    id,
  }: GetWorkstationTypeByIdUseCaseRequest): Promise<GetWorkstationTypeByIdUseCaseResponse> {
    const workstationType = await this.workstationTypesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workstationType) {
      throw new ResourceNotFoundError('Workstation type not found.');
    }

    return {
      workstationType,
    };
  }
}
