import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { Pipeline } from '@/entities/sales/pipeline';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChangeDealStageUseCase } from './change-deal-stage';

let dealsRepository: InMemoryDealsRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let timelineEventsRepository: InMemoryTimelineEventsRepository;
let sut: ChangeDealStageUseCase;

const TENANT_ID = 'tenant-1';
let pipelineId: UniqueEntityID;
let stage1Id: UniqueEntityID;
let stage2Id: UniqueEntityID;
let wonStageId: UniqueEntityID;
let lostStageId: UniqueEntityID;

describe('ChangeDealStageUseCase', () => {
  beforeEach(async () => {
    dealsRepository = new InMemoryDealsRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    timelineEventsRepository = new InMemoryTimelineEventsRepository();
    sut = new ChangeDealStageUseCase(
      dealsRepository,
      pipelineStagesRepository,
      timelineEventsRepository,
    );

    // Create pipeline
    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Sales Pipeline',
      type: 'SALES',
    });
    await pipelinesRepository.create(pipeline);
    pipelineId = pipeline.id;

    // Create stages
    const stage1 = PipelineStage.create({
      pipelineId: pipeline.id,
      name: 'Prospecting',
      type: 'NORMAL',
      position: 0,
    });
    await pipelineStagesRepository.create(stage1);
    stage1Id = stage1.id;

    const stage2 = PipelineStage.create({
      pipelineId: pipeline.id,
      name: 'Negotiation',
      type: 'NORMAL',
      position: 1,
    });
    await pipelineStagesRepository.create(stage2);
    stage2Id = stage2.id;

    const wonStage = PipelineStage.create({
      pipelineId: pipeline.id,
      name: 'Closed Won',
      type: 'WON',
      position: 2,
    });
    await pipelineStagesRepository.create(wonStage);
    wonStageId = wonStage.id;

    const lostStage = PipelineStage.create({
      pipelineId: pipeline.id,
      name: 'Closed Lost',
      type: 'LOST',
      position: 3,
    });
    await pipelineStagesRepository.create(lostStage);
    lostStageId = lostStage.id;
  });

  it('should move deal to a new stage in the same pipeline', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Big Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId,
      stageId: stage1Id,
    });
    await dealsRepository.create(deal);

    const result = await sut.execute({
      id: deal.id.toString(),
      tenantId: TENANT_ID,
      stageId: stage2Id.toString(),
    });

    expect(result.deal.stageId.toString()).toBe(stage2Id.toString());
    expect(result.deal.status).toBe('OPEN');
    expect(result.deal.stageEnteredAt).toBeDefined();
  });

  it('should set status to WON when moving to a WON stage', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Winning Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId,
      stageId: stage1Id,
    });
    await dealsRepository.create(deal);

    const result = await sut.execute({
      id: deal.id.toString(),
      tenantId: TENANT_ID,
      stageId: wonStageId.toString(),
    });

    expect(result.deal.status).toBe('WON');
    expect(result.deal.wonAt).toBeDefined();
    expect(result.deal.closedAt).toBeDefined();
  });

  it('should set status to LOST when moving to a LOST stage', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Losing Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId,
      stageId: stage1Id,
    });
    await dealsRepository.create(deal);

    const result = await sut.execute({
      id: deal.id.toString(),
      tenantId: TENANT_ID,
      stageId: lostStageId.toString(),
      lostReason: 'Too expensive',
    });

    expect(result.deal.status).toBe('LOST');
    expect(result.deal.lostAt).toBeDefined();
    expect(result.deal.closedAt).toBeDefined();
    expect(result.deal.lostReason).toBe('Too expensive');
  });

  it('should create a TimelineEvent on stage change', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Timeline Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId,
      stageId: stage1Id,
    });
    await dealsRepository.create(deal);

    await sut.execute({
      id: deal.id.toString(),
      tenantId: TENANT_ID,
      stageId: stage2Id.toString(),
    });

    expect(timelineEventsRepository.items).toHaveLength(1);

    const event = timelineEventsRepository.items[0];
    expect(event.type).toBe('STAGE_CHANGE');
    expect(event.dealId?.toString()).toBe(deal.id.toString());
    expect(event.metadata?.fromStageId).toBe(stage1Id.toString());
    expect(event.metadata?.fromStageName).toBe('Prospecting');
    expect(event.metadata?.toStageId).toBe(stage2Id.toString());
    expect(event.metadata?.toStageName).toBe('Negotiation');
  });

  it('should throw ResourceNotFoundError when deal does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-deal',
        tenantId: TENANT_ID,
        stageId: stage2Id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when stage does not exist', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId,
      stageId: stage1Id,
    });
    await dealsRepository.create(deal);

    await expect(
      sut.execute({
        id: deal.id.toString(),
        tenantId: TENANT_ID,
        stageId: 'non-existent-stage',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError when stage does not belong to deal pipeline', async () => {
    // Create another pipeline with a stage
    const otherPipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Other Pipeline',
      type: 'SUPPORT',
    });
    await pipelinesRepository.create(otherPipeline);

    const otherStage = PipelineStage.create({
      pipelineId: otherPipeline.id,
      name: 'Other Stage',
      type: 'NORMAL',
      position: 0,
    });
    await pipelineStagesRepository.create(otherStage);

    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId,
      stageId: stage1Id,
    });
    await dealsRepository.create(deal);

    await expect(
      sut.execute({
        id: deal.id.toString(),
        tenantId: TENANT_ID,
        stageId: otherStage.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
