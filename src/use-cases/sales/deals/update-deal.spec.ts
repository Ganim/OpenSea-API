import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateDealUseCase } from './update-deal';

let dealsRepository: InMemoryDealsRepository;
let timelineRepository: InMemoryTimelineEventsRepository;
let sut: UpdateDealUseCase;

describe('Update Deal Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    dealsRepository = new InMemoryDealsRepository();
    timelineRepository = new InMemoryTimelineEventsRepository();
    sut = new UpdateDealUseCase(dealsRepository, timelineRepository);
  });

  it('should update a deal title', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Old Title',
      customerId: new UniqueEntityID('cust-1'),
      pipelineId: new UniqueEntityID('pipeline-1'),
      stageId: new UniqueEntityID('stage-1'),
      priority: 'MEDIUM',
      currency: 'BRL',
      tags: [],
    });
    dealsRepository.items.push(deal);

    const result = await sut.execute({
      id: deal.id.toString(),
      tenantId: TENANT_ID,
      title: 'New Title',
    });

    expect(result.deal.title).toBe('New Title');
  });

  it('should create timeline event on stage change', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Deal',
      customerId: new UniqueEntityID('cust-1'),
      pipelineId: new UniqueEntityID('pipeline-1'),
      stageId: new UniqueEntityID('stage-1'),
      priority: 'MEDIUM',
      currency: 'BRL',
      tags: [],
    });
    dealsRepository.items.push(deal);

    await sut.execute({
      id: deal.id.toString(),
      tenantId: TENANT_ID,
      stageId: 'stage-2',
    });

    expect(timelineRepository.items).toHaveLength(1);
    expect(timelineRepository.items[0]!.type).toBe('STAGE_CHANGED');
  });

  it('should throw if deal not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID, title: 'Test' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
