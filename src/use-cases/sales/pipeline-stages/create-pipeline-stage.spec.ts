import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { makePipeline } from '@/utils/tests/factories/sales/make-pipeline';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePipelineStageUseCase } from './create-pipeline-stage';

let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let sut: CreatePipelineStageUseCase;

const TENANT_ID = 'tenant-1';

describe('CreatePipelineStageUseCase', () => {
  beforeEach(() => {
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new CreatePipelineStageUseCase(
      pipelineStagesRepository,
      pipelinesRepository,
    );
  });

  it('should create a stage with type OPEN', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      pipelineId: pipeline.id.toString(),
      name: 'New Lead',
      type: 'OPEN',
    });

    expect(result.stage.name).toBe('New Lead');
    expect(result.stage.type).toBe('OPEN');
    expect(result.stage.pipelineId.equals(pipeline.id)).toBe(true);
    expect(result.stage.id).toBeDefined();
  });

  it('should create a stage with type WON', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      pipelineId: pipeline.id.toString(),
      name: 'Deal Won',
      type: 'WON',
    });

    expect(result.stage.type).toBe('WON');
  });

  it('should throw when pipeline is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        pipelineId: 'non-existent-pipeline',
        name: 'New Lead',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow PROCESSING stage type on CRM pipeline', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        pipelineId: pipeline.id.toString(),
        name: 'Processing',
        type: 'PROCESSING',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow SHIPPED stage type on SUPPORT pipeline', async () => {
    const pipeline = makePipeline({ type: 'SUPPORT' });
    await pipelinesRepository.create(pipeline);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        pipelineId: pipeline.id.toString(),
        name: 'Shipped',
        type: 'SHIPPED',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow all stage types on ORDER pipeline', async () => {
    const pipeline = makePipeline({ type: 'ORDER_B2C' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      pipelineId: pipeline.id.toString(),
      name: 'Processing',
      type: 'PROCESSING',
    });

    expect(result.stage.type).toBe('PROCESSING');
  });

  it('should allow SHIPPED stage type on ORDER_B2B pipeline', async () => {
    const pipeline = makePipeline({ type: 'ORDER_B2B' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      pipelineId: pipeline.id.toString(),
      name: 'Shipped',
      type: 'SHIPPED',
    });

    expect(result.stage.type).toBe('SHIPPED');
  });

  it('should default stage type to OPEN', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      pipelineId: pipeline.id.toString(),
      name: 'Default Stage',
    });

    expect(result.stage.type).toBe('OPEN');
  });

  it('should not create a stage with empty name', async () => {
    const pipeline = makePipeline({ type: 'SALES' });
    await pipelinesRepository.create(pipeline);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        pipelineId: pipeline.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
