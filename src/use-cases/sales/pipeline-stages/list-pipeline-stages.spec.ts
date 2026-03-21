import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPipelineStagesUseCase } from './list-pipeline-stages';

let stagesRepository: InMemoryPipelineStagesRepository;
let sut: ListPipelineStagesUseCase;

describe('List Pipeline Stages Use Case', () => {
  const PIPELINE_ID = 'pipeline-1';

  beforeEach(() => {
    stagesRepository = new InMemoryPipelineStagesRepository();
    sut = new ListPipelineStagesUseCase(stagesRepository);
  });

  it('should list stages for a pipeline', async () => {
    for (let i = 0; i < 3; i++) {
      stagesRepository.items.push(
        PipelineStage.create({
          pipelineId: new UniqueEntityID(PIPELINE_ID),
          name: `Stage ${i}`,
          type: 'OPEN',
          position: i,
        }),
      );
    }

    const result = await sut.execute({ pipelineId: PIPELINE_ID });

    expect(result.stages).toHaveLength(3);
  });

  it('should return empty list when no stages', async () => {
    const result = await sut.execute({ pipelineId: PIPELINE_ID });

    expect(result.stages).toHaveLength(0);
  });
});
