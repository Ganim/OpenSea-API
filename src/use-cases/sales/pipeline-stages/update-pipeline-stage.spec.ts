import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { makePipeline } from '@/utils/tests/factories/sales/make-pipeline';
import { makePipelineStage } from '@/utils/tests/factories/sales/make-pipeline-stage';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePipelineStageUseCase } from './update-pipeline-stage';

let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let sut: UpdatePipelineStageUseCase;

const TENANT_ID = 'tenant-1';

describe('UpdatePipelineStageUseCase', () => {
  beforeEach(() => {
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new UpdatePipelineStageUseCase(
      pipelineStagesRepository,
      pipelinesRepository,
    );
  });

  it('should update a stage name', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    const stage = makePipelineStage({
      pipelineId: pipeline.id,
      name: 'New Lead',
    });
    await pipelineStagesRepository.create(stage);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: stage.id.toString(),
      name: 'Qualified Lead',
    });

    expect(result.stage.name).toBe('Qualified Lead');
  });

  it('should update a stage position', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    const stage = makePipelineStage({
      pipelineId: pipeline.id,
      name: 'New Lead',
      position: 0,
    });
    await pipelineStagesRepository.create(stage);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: stage.id.toString(),
      position: 3,
    });

    expect(result.stage.position).toBe(3);
  });

  it('should throw when stage is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow invalid stage type for CRM pipeline', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    const stage = makePipelineStage({
      pipelineId: pipeline.id,
      name: 'New Lead',
      type: 'OPEN',
    });
    await pipelineStagesRepository.create(stage);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: stage.id.toString(),
        type: 'PROCESSING',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow any stage type for ORDER pipeline', async () => {
    const pipeline = makePipeline({ type: 'ORDER_B2C' });
    await pipelinesRepository.create(pipeline);

    const stage = makePipelineStage({
      pipelineId: pipeline.id,
      name: 'New Order',
      type: 'OPEN',
    });
    await pipelineStagesRepository.create(stage);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: stage.id.toString(),
      type: 'PROCESSING',
    });

    expect(result.stage.type).toBe('PROCESSING');
  });

  it('should not update to empty name', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    const stage = makePipelineStage({
      pipelineId: pipeline.id,
      name: 'New Lead',
    });
    await pipelineStagesRepository.create(stage);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: stage.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
