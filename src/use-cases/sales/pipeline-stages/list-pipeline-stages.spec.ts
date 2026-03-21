import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { makePipelineStage } from '@/utils/tests/factories/sales/make-pipeline-stage';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPipelineStagesUseCase } from './list-pipeline-stages';

let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: ListPipelineStagesUseCase;

const PIPELINE_ID = 'pipeline-1';

describe('ListPipelineStagesUseCase', () => {
  beforeEach(() => {
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    sut = new ListPipelineStagesUseCase(pipelineStagesRepository);
  });

  it('should list stages by pipeline', async () => {
    const pipelineId = new UniqueEntityID(PIPELINE_ID);
    const stage1 = makePipelineStage({
      pipelineId,
      name: 'New Lead',
      position: 0,
    });
    const stage2 = makePipelineStage({
      pipelineId,
      name: 'Qualified',
      position: 1,
    });
    await pipelineStagesRepository.create(stage1);
    await pipelineStagesRepository.create(stage2);

    const result = await sut.execute({ pipelineId: PIPELINE_ID });

    expect(result.stages).toHaveLength(2);
  });

  it('should return stages ordered by position', async () => {
    const pipelineId = new UniqueEntityID(PIPELINE_ID);
    const stage1 = makePipelineStage({
      pipelineId,
      name: 'Third',
      position: 2,
    });
    const stage2 = makePipelineStage({
      pipelineId,
      name: 'First',
      position: 0,
    });
    const stage3 = makePipelineStage({
      pipelineId,
      name: 'Second',
      position: 1,
    });
    await pipelineStagesRepository.create(stage1);
    await pipelineStagesRepository.create(stage2);
    await pipelineStagesRepository.create(stage3);

    const result = await sut.execute({ pipelineId: PIPELINE_ID });

    expect(result.stages[0].name).toBe('First');
    expect(result.stages[1].name).toBe('Second');
    expect(result.stages[2].name).toBe('Third');
  });

  it('should return empty array when no stages exist', async () => {
    const result = await sut.execute({ pipelineId: PIPELINE_ID });

    expect(result.stages).toHaveLength(0);
  });

  it('should not return stages from other pipelines', async () => {
    const otherPipelineId = new UniqueEntityID('other-pipeline');
    const stage = makePipelineStage({
      pipelineId: otherPipelineId,
      name: 'Other Stage',
    });
    await pipelineStagesRepository.create(stage);

    const result = await sut.execute({ pipelineId: PIPELINE_ID });

    expect(result.stages).toHaveLength(0);
  });
});
