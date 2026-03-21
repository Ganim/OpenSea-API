import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReorderPipelineStagesUseCase } from './reorder-pipeline-stages';

let stagesRepository: InMemoryPipelineStagesRepository;
let sut: ReorderPipelineStagesUseCase;

describe('Reorder Pipeline Stages Use Case', () => {
  const PIPELINE_ID = 'pipeline-1';

  beforeEach(() => {
    stagesRepository = new InMemoryPipelineStagesRepository();
    sut = new ReorderPipelineStagesUseCase(stagesRepository);
  });

  it('should reorder stages', async () => {
    const stages = [0, 1, 2].map((i) =>
      PipelineStage.create({
        pipelineId: new UniqueEntityID(PIPELINE_ID),
        name: `Stage ${i}`,
        type: 'OPEN',
        position: i,
      }),
    );
    stages.forEach((s) => stagesRepository.items.push(s));

    const reversedIds = stages.map((s) => s.id.toString()).reverse();

    await sut.execute({ pipelineId: PIPELINE_ID, stageIds: reversedIds });

    const reordered = await stagesRepository.findManyByPipeline(
      new UniqueEntityID(PIPELINE_ID),
    );
    expect(reordered[0]!.id.toString()).toBe(reversedIds[0]);
  });

  it('should reject empty stage IDs', async () => {
    await expect(() =>
      sut.execute({ pipelineId: PIPELINE_ID, stageIds: [] }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject non-existent stage IDs', async () => {
    await expect(() =>
      sut.execute({ pipelineId: PIPELINE_ID, stageIds: ['non-existent'] }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
