import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListDealsUseCase } from './list-deals';

let dealsRepository: InMemoryDealsRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: ListDealsUseCase;

const TENANT_ID = 'tenant-1';
let pipelineId: string;
let pipeline2Id: string;
let stageId: string;

describe('ListDealsUseCase', () => {
  beforeEach(async () => {
    dealsRepository = new InMemoryDealsRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    sut = new ListDealsUseCase(dealsRepository);

    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Sales Pipeline',
      type: 'SALES',
    });
    await pipelinesRepository.create(pipeline);
    pipelineId = pipeline.id.toString();

    const pipeline2 = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Support Pipeline',
      type: 'SUPPORT',
    });
    await pipelinesRepository.create(pipeline2);
    pipeline2Id = pipeline2.id.toString();

    const stage = PipelineStage.create({
      pipelineId: pipeline.id,
      name: 'Prospecting',
      type: 'NORMAL',
      position: 0,
    });
    await pipelineStagesRepository.create(stage);
    stageId = stage.id.toString();
  });

  it('should list deals with pagination', async () => {
    // Create 5 deals
    for (let i = 0; i < 5; i++) {
      await dealsRepository.create({
        tenantId: TENANT_ID,
        title: `Deal ${i + 1}`,
        customerId: 'customer-1',
        pipelineId,
        stageId,
      });
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 3,
    });

    expect(result.deals).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(1);
  });

  it('should filter deals by status', async () => {
    await dealsRepository.create({
      tenantId: TENANT_ID,
      title: 'Open Deal',
      customerId: 'customer-1',
      pipelineId,
      stageId,
      status: 'OPEN',
    });

    await dealsRepository.create({
      tenantId: TENANT_ID,
      title: 'Won Deal',
      customerId: 'customer-1',
      pipelineId,
      stageId,
      status: 'WON',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      status: 'OPEN',
    });

    expect(result.deals).toHaveLength(1);
    expect(result.deals[0].title).toBe('Open Deal');
  });

  it('should filter deals by pipeline', async () => {
    await dealsRepository.create({
      tenantId: TENANT_ID,
      title: 'Sales Deal',
      customerId: 'customer-1',
      pipelineId,
      stageId,
    });

    await dealsRepository.create({
      tenantId: TENANT_ID,
      title: 'Support Deal',
      customerId: 'customer-1',
      pipelineId: pipeline2Id,
      stageId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      pipelineId,
    });

    expect(result.deals).toHaveLength(1);
    expect(result.deals[0].title).toBe('Sales Deal');
  });
});
