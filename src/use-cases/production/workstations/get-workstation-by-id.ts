import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkstationsRepository } from '@/repositories/production/workstations-repository';

interface GetWorkstationByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetWorkstationByIdUseCaseResponse {
  workstation: import('@/entities/production/workstation').ProductionWorkstation;
}

export class GetWorkstationByIdUseCase {
  constructor(private workstationsRepository: WorkstationsRepository) {}

  async execute({
    tenantId,
    id,
  }: GetWorkstationByIdUseCaseRequest): Promise<GetWorkstationByIdUseCaseResponse> {
    const workstation = await this.workstationsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workstation) {
      throw new ResourceNotFoundError('Workstation not found.');
    }

    return {
      workstation,
    };
  }
}
