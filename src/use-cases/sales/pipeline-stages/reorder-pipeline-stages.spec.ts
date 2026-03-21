import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { makePipelineStage } from '@/utils/tests/factories/sales/make-pipeline-stage';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReorderPipelineStagesUseCase } from './reorder-pipeline-stages';

let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: ReorderPipelineStagesUseCase;

const PIPELINE_ID = 'pipeline-1';

describe('ReorderPipelineStagesUseCase', () => {
  beforeEach(() => {
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    sut = new ReorderPipelineStagesUseCase(pipelineStagesRepository);
  });

  it('should reorder pipeline stages', async () => {
    const pipelineId = new UniqueEntityID(PIPELINE_ID);
    const stage1 = makePipelineStage({
      pipelineId,
      name: 'First',
      position: 0,
    });
    const stage2 = makePipelineStage({
      pipelineId,
      name: 'Second',
      position: 1,
    });
    const stage3 = makePipelineStage({
      pipelineId,
      name: 'Third',
      position: 2,
    });
    await pipelineStagesRepository.create(stage1);
    await pipelineStagesRepository.create(stage2);
    await pipelineStagesRepository.create(stage3);

    // Reverse the order
    await sut.execute({
      pipelineId: PIPELINE_ID,
      stageIds: [
        stage3.id.toString(),
        stage2.id.toString(),
        stage1.id.toString(),
      ],
    });

    const stages =
      await pipelineStagesRepository.findManyByPipeline(pipelineId);

    expect(stages[0].name).toBe('Third');
    expect(stages[0].position).toBe(0);
    expect(stages[1].name).toBe('Second');
    expect(stages[1].position).toBe(1);
    expect(stages[2].name).toBe('First');
    expect(stages[2].position).toBe(2);
  });

  it('should throw when stageIds is empty', async () => {
    const { BadRequestError } = await import(
      '@/@errors/use-cases/bad-request-error'
    );

    await expect(
      sut.execute({
        pipelineId: PIPELINE_ID,
        stageIds: [],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when stage does not belong to pipeline', async () => {
    const { BadRequestError } = await import(
      '@/@errors/use-cases/bad-request-error'
    );

    const pipelineId = new UniqueEntityID(PIPELINE_ID);
    const stage = makePipelineStage({
      pipelineId,
      name: 'Stage',
      position: 0,
    });
    await pipelineStagesRepository.create(stage);

    await expect(
      sut.execute({
        pipelineId: PIPELINE_ID,
        stageIds: [stage.id.toString(), 'non-existent-stage-id'],
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
