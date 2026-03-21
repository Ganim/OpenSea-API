import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDealUseCase } from './create-deal';

let dealsRepository: InMemoryDealsRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: CreateDealUseCase;

const TENANT_ID = 'tenant-1';
let pipelineId: string;
let stageId: string;

describe('CreateDealUseCase', () => {
  beforeEach(async () => {
    dealsRepository = new InMemoryDealsRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    sut = new CreateDealUseCase(
      dealsRepository,
      pipelinesRepository,
      pipelineStagesRepository,
    );

    // Create a pipeline
    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Sales Pipeline',
      type: 'SALES',
    });
    await pipelinesRepository.create(pipeline);
    pipelineId = pipeline.id.toString();

    // Create a stage in that pipeline
    const stage = PipelineStage.create({
      pipelineId: pipeline.id,
      name: 'Prospecting',
      type: 'NORMAL',
      position: 0,
    });
    await pipelineStagesRepository.create(stage);
    stageId = stage.id.toString();
  });

  it('should create a deal with valid pipeline and stage', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      title: 'Big Deal',
      customerId: 'customer-1',
      pipelineId,
      stageId,
      value: 10000,
    });

    expect(result.deal.id).toBeDefined();
    expect(result.deal.title).toBe('Big Deal');
    expect(result.deal.pipelineId.toString()).toBe(pipelineId);
    expect(result.deal.stageId.toString()).toBe(stageId);
    expect(result.deal.value).toBe(10000);
    expect(result.deal.status).toBe('OPEN');
    expect(result.deal.currency).toBe('BRL');
  });

  it('should throw ResourceNotFoundError when pipeline does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        title: 'Big Deal',
        customerId: 'customer-1',
        pipelineId: 'non-existent-pipeline',
        stageId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when stage does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        title: 'Big Deal',
        customerId: 'customer-1',
        pipelineId,
        stageId: 'non-existent-stage',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError when stage does not belong to pipeline', async () => {
    // Create another pipeline with a stage
    const otherPipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Other Pipeline',
      type: 'SALES',
    });
    await pipelinesRepository.create(otherPipeline);

    const otherStage = PipelineStage.create({
      pipelineId: otherPipeline.id,
      name: 'Other Stage',
      type: 'NORMAL',
      position: 0,
    });
    await pipelineStagesRepository.create(otherStage);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        title: 'Big Deal',
        customerId: 'customer-1',
        pipelineId,
        stageId: otherStage.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when title is empty', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        title: '',
        customerId: 'customer-1',
        pipelineId,
        stageId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when title is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        title: '   ',
        customerId: 'customer-1',
        pipelineId,
        stageId,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
