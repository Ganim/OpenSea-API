import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';

interface DeleteConsortiumUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteConsortiumUseCase {
  constructor(private consortiaRepository: ConsortiaRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteConsortiumUseCaseRequest): Promise<void> {
    const consortium = await this.consortiaRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!consortium) {
      throw new ResourceNotFoundError('Consortium not found');
    }

    await this.consortiaRepository.delete(new UniqueEntityID(id));
  }
}
