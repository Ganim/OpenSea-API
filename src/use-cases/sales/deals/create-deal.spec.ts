import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDealUseCase } from './create-deal';

let dealsRepository: InMemoryDealsRepository;
let customersRepository: InMemoryCustomersRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let stagesRepository: InMemoryPipelineStagesRepository;
let timelineRepository: InMemoryTimelineEventsRepository;
let sut: CreateDealUseCase;

describe('Create Deal Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let customerId: string;
  let pipelineId: string;
  let stageId: string;

  beforeEach(async () => {
    dealsRepository = new InMemoryDealsRepository();
    customersRepository = new InMemoryCustomersRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    stagesRepository = new InMemoryPipelineStagesRepository();
    timelineRepository = new InMemoryTimelineEventsRepository();
    sut = new CreateDealUseCase(
      dealsRepository,
      customersRepository,
      pipelinesRepository,
      stagesRepository,
      timelineRepository,
    );

    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'Acme Corp',
      type: CustomerType.create('BUSINESS'),
    });
    customerId = customer.id.toString();

    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Sales',
      type: 'SALES',
      isDefault: true,
    });
    pipelinesRepository.items.push(pipeline);
    pipelineId = pipeline.id.toString();

    const stage = PipelineStage.create({
      pipelineId: pipeline.id,
      name: 'Qualification',
      type: 'OPEN',
    });
    stagesRepository.items.push(stage);
    stageId = stage.id.toString();
  });

  it('should create a deal', async () => {
    const { deal } = await sut.execute({
      tenantId: TENANT_ID,
      title: 'Big Deal',
      customerId,
      pipelineId,
      stageId,
    });

    expect(deal.id.toString()).toEqual(expect.any(String));
    expect(deal.title).toBe('Big Deal');
    expect(deal.priority).toBe('MEDIUM');
    expect(dealsRepository.items).toHaveLength(1);
    expect(timelineRepository.items).toHaveLength(1);
  });

  it('should not create a deal with empty title', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        title: '',
        customerId,
        pipelineId,
        stageId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create a deal for non-existent customer', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        title: 'Deal',
        customerId: 'non-existent',
        pipelineId,
        stageId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not create a deal for non-existent pipeline', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        title: 'Deal',
        customerId,
        pipelineId: 'non-existent',
        stageId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
