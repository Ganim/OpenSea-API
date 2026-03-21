import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

interface DeletePipelineUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeletePipelineUseCase {
  constructor(private pipelinesRepository: PipelinesRepository) {}

  async execute(request: DeletePipelineUseCaseRequest): Promise<void> {
    const { tenantId, id } = request;

    const pipeline = await this.pipelinesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!pipeline) {
      throw new ResourceNotFoundError('Pipeline not found');
    }

    await this.pipelinesRepository.delete(new UniqueEntityID(id));
  }
}
