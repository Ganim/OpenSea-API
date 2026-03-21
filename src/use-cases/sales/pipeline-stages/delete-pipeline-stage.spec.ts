import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePipelineStageUseCase } from './delete-pipeline-stage';

let stagesRepository: InMemoryPipelineStagesRepository;
let sut: DeletePipelineStageUseCase;

describe('Delete Pipeline Stage Use Case', () => {
  beforeEach(() => {
    stagesRepository = new InMemoryPipelineStagesRepository();
    sut = new DeletePipelineStageUseCase(stagesRepository);
  });

  it('should delete a pipeline stage', async () => {
    const stage = PipelineStage.create({
      pipelineId: new UniqueEntityID('pipeline-1'),
      name: 'Qualification',
      type: 'OPEN',
    });
    stagesRepository.items.push(stage);

    await sut.execute({ id: stage.id.toString() });

    expect(stagesRepository.items).toHaveLength(0);
  });

  it('should throw if stage not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
