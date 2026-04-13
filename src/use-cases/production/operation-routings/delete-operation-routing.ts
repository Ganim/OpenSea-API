import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OperationRoutingsRepository } from '@/repositories/production/operation-routings-repository';

interface DeleteOperationRoutingUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteOperationRoutingUseCaseResponse {
  message: string;
}

export class DeleteOperationRoutingUseCase {
  constructor(
    private operationRoutingsRepository: OperationRoutingsRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: DeleteOperationRoutingUseCaseRequest): Promise<DeleteOperationRoutingUseCaseResponse> {
    const existing = await this.operationRoutingsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Operation routing not found.');
    }

    await this.operationRoutingsRepository.delete(new UniqueEntityID(id));

    return { message: 'Operation routing deleted successfully.' };
  }
}
