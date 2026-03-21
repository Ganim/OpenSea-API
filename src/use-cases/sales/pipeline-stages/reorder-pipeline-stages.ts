import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

interface ReorderPipelineStagesUseCaseRequest {
  pipelineId: string;
  stageIds: string[];
}

export class ReorderPipelineStagesUseCase {
  constructor(private pipelineStagesRepository: PipelineStagesRepository) {}

  async execute(request: ReorderPipelineStagesUseCaseRequest): Promise<void> {
    const { pipelineId, stageIds } = request;

    if (!stageIds || stageIds.length === 0) {
      throw new BadRequestError('Stage IDs are required');
    }

    const pipelineUniqueId = new UniqueEntityID(pipelineId);

    const existingStages =
      await this.pipelineStagesRepository.findManyByPipeline(pipelineUniqueId);

    const existingIds = new Set(existingStages.map((s) => s.id.toString()));

    for (const stageId of stageIds) {
      if (!existingIds.has(stageId)) {
        throw new BadRequestError(
          `Stage ${stageId} does not belong to pipeline ${pipelineId}`,
        );
      }
    }

    await this.pipelineStagesRepository.reorder(pipelineUniqueId, stageIds);
  }
}
