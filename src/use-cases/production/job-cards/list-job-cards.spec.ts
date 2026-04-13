import { InMemoryJobCardsRepository } from '@/repositories/production/in-memory/in-memory-job-cards-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateJobCardUseCase } from './create-job-card';
import { ListJobCardsUseCase } from './list-job-cards';

let jobCardsRepository: InMemoryJobCardsRepository;
let createJobCard: CreateJobCardUseCase;
let sut: ListJobCardsUseCase;

describe('ListJobCardsUseCase', () => {
  beforeEach(() => {
    jobCardsRepository = new InMemoryJobCardsRepository();
    createJobCard = new CreateJobCardUseCase(jobCardsRepository);
    sut = new ListJobCardsUseCase(jobCardsRepository);
  });

  it('should return empty list when no job cards exist', async () => {
    const { jobCards } = await sut.execute({
      tenantId: 'tenant-1',
      productionOrderId: 'order-1',
    });

    expect(jobCards).toHaveLength(0);
  });

  it('should list job cards by production order', async () => {
    await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-2',
      quantityPlanned: 50,
    });

    await createJobCard.execute({
      productionOrderId: 'order-2',
      operationRoutingId: 'routing-1',
      quantityPlanned: 75,
    });

    const { jobCards } = await sut.execute({
      tenantId: 'tenant-1',
      productionOrderId: 'order-1',
    });

    expect(jobCards).toHaveLength(2);
  });

  it('should list job cards by workstation', async () => {
    await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      workstationId: 'ws-1',
      quantityPlanned: 100,
    });

    await createJobCard.execute({
      productionOrderId: 'order-2',
      operationRoutingId: 'routing-2',
      workstationId: 'ws-1',
      quantityPlanned: 50,
    });

    await createJobCard.execute({
      productionOrderId: 'order-3',
      operationRoutingId: 'routing-3',
      workstationId: 'ws-2',
      quantityPlanned: 75,
    });

    const { jobCards } = await sut.execute({
      tenantId: 'tenant-1',
      workstationId: 'ws-1',
    });

    expect(jobCards).toHaveLength(2);
  });

  it('should return empty if neither filter is provided', async () => {
    await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    const { jobCards } = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(jobCards).toHaveLength(0);
  });
});
