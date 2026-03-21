import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PipelineStage } from '@/entities/sales/pipeline-stage';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

interface ListPipelineStagesUseCaseRequest {
  pipelineId: string;
}

interface ListPipelineStagesUseCaseResponse {
  stages: PipelineStage[];
}

export class ListPipelineStagesUseCase {
  constructor(private pipelineStagesRepository: PipelineStagesRepository) {}

  async execute(
    request: ListPipelineStagesUseCaseRequest,
  ): Promise<ListPipelineStagesUseCaseResponse> {
    const { pipelineId } = request;

    const stages = await this.pipelineStagesRepository.findManyByPipeline(
      new UniqueEntityID(pipelineId),
    );

    return { stages };
  }
}
