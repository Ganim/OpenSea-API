import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkstationTypesRepository } from '@/repositories/production/workstation-types-repository';

interface DeleteWorkstationTypeUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteWorkstationTypeUseCaseResponse {
  message: string;
}

export class DeleteWorkstationTypeUseCase {
  constructor(
    private workstationTypesRepository: WorkstationTypesRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: DeleteWorkstationTypeUseCaseRequest): Promise<DeleteWorkstationTypeUseCaseResponse> {
    const workstationType = await this.workstationTypesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workstationType) {
      throw new ResourceNotFoundError('Workstation type not found.');
    }

    await this.workstationTypesRepository.delete(new UniqueEntityID(id));

    return {
      message: 'Workstation type deleted successfully.',
    };
  }
}
