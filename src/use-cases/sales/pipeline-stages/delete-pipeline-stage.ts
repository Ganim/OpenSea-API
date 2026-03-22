import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

interface DeletePipelineStageUseCaseRequest {
  id: string;
}

export class DeletePipelineStageUseCase {
  constructor(private pipelineStagesRepository: PipelineStagesRepository) {}

  async execute(request: DeletePipelineStageUseCaseRequest): Promise<void> {
    const { id } = request;

    const stage = await this.pipelineStagesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!stage) {
      throw new ResourceNotFoundError('Pipeline stage not found');
    }

    await this.pipelineStagesRepository.delete(new UniqueEntityID(id));
  }
}
