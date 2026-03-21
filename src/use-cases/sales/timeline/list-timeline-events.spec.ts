import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { TimelineEvent } from '@/entities/sales/timeline-event';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTimelineEventsUseCase } from './list-timeline-events';

let timelineRepository: InMemoryTimelineEventsRepository;
let dealsRepository: InMemoryDealsRepository;
let sut: ListTimelineEventsUseCase;

describe('List Timeline Events Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let dealId: string;

  beforeEach(() => {
    timelineRepository = new InMemoryTimelineEventsRepository();
    dealsRepository = new InMemoryDealsRepository();
    sut = new ListTimelineEventsUseCase(timelineRepository, dealsRepository);

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
    dealId = deal.id.toString();
  });

  it('should list timeline events for a deal', async () => {
    for (let i = 0; i < 3; i++) {
      timelineRepository.items.push(
        TimelineEvent.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          dealId: new UniqueEntityID(dealId),
          type: 'DEAL_UPDATED',
          title: `Event ${i}`,
        }),
      );
    }

    const result = await sut.execute({ dealId, tenantId: TENANT_ID });

    expect(result.events).toHaveLength(3);
  });

  it('should throw if deal not found', async () => {
    await expect(() =>
      sut.execute({ dealId: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
