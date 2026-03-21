import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { makePipelineStage } from '@/utils/tests/factories/sales/make-pipeline-stage';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePipelineStageUseCase } from './delete-pipeline-stage';

let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: DeletePipelineStageUseCase;

describe('DeletePipelineStageUseCase', () => {
  beforeEach(() => {
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    sut = new DeletePipelineStageUseCase(pipelineStagesRepository);
  });

  it('should hard delete a pipeline stage', async () => {
    const pipelineId = new UniqueEntityID('pipeline-1');
    const stage = makePipelineStage({
      pipelineId,
      name: 'New Lead',
    });
    await pipelineStagesRepository.create(stage);

    await sut.execute({ id: stage.id.toString() });

    const found = await pipelineStagesRepository.findById(stage.id);
    expect(found).toBeNull();

    // Verify it's completely removed (hard delete)
    expect(pipelineStagesRepository.items).toHaveLength(0);
  });

  it('should throw when stage is not found', async () => {
    await expect(
      sut.execute({ id: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
