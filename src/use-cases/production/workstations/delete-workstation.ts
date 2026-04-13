import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkstationsRepository } from '@/repositories/production/workstations-repository';

interface DeleteWorkstationUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteWorkstationUseCaseResponse {
  message: string;
}

export class DeleteWorkstationUseCase {
  constructor(private workstationsRepository: WorkstationsRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteWorkstationUseCaseRequest): Promise<DeleteWorkstationUseCaseResponse> {
    const workstation = await this.workstationsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workstation) {
      throw new ResourceNotFoundError('Workstation not found.');
    }

    await this.workstationsRepository.delete(new UniqueEntityID(id));

    return {
      message: 'Workstation deleted successfully.',
    };
  }
}
