import { InMemoryQualityHoldsRepository } from '@/repositories/production/in-memory/in-memory-quality-holds-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQualityHoldUseCase } from './create-quality-hold';
import { ListQualityHoldsUseCase } from './list-quality-holds';
import { ReleaseQualityHoldUseCase } from './release-quality-hold';

let qualityHoldsRepository: InMemoryQualityHoldsRepository;
let createQualityHold: CreateQualityHoldUseCase;
let releaseQualityHold: ReleaseQualityHoldUseCase;
let sut: ListQualityHoldsUseCase;

describe('ListQualityHoldsUseCase', () => {
  beforeEach(() => {
    qualityHoldsRepository = new InMemoryQualityHoldsRepository();
    createQualityHold = new CreateQualityHoldUseCase(qualityHoldsRepository);
    releaseQualityHold = new ReleaseQualityHoldUseCase(qualityHoldsRepository);
    sut = new ListQualityHoldsUseCase(qualityHoldsRepository);
  });

  it('should return empty list when no holds exist', async () => {
    const { qualityHolds } = await sut.execute({});

    expect(qualityHolds).toHaveLength(0);
  });

  it('should list all quality holds', async () => {
    await createQualityHold.execute({
      productionOrderId: 'order-1',
      reason: 'Issue 1',
      holdById: 'user-1',
    });

    await createQualityHold.execute({
      productionOrderId: 'order-2',
      reason: 'Issue 2',
      holdById: 'user-1',
    });

    const { qualityHolds } = await sut.execute({});

    expect(qualityHolds).toHaveLength(2);
  });

  it('should filter by production order', async () => {
    await createQualityHold.execute({
      productionOrderId: 'order-1',
      reason: 'Issue 1',
      holdById: 'user-1',
    });

    await createQualityHold.execute({
      productionOrderId: 'order-2',
      reason: 'Issue 2',
      holdById: 'user-1',
    });

    const { qualityHolds } = await sut.execute({
      productionOrderId: 'order-1',
    });

    expect(qualityHolds).toHaveLength(1);
    expect(qualityHolds[0].productionOrderId.toString()).toBe('order-1');
  });

  it('should filter by status', async () => {
    const { qualityHold: hold1 } = await createQualityHold.execute({
      productionOrderId: 'order-1',
      reason: 'Issue 1',
      holdById: 'user-1',
    });

    await createQualityHold.execute({
      productionOrderId: 'order-2',
      reason: 'Issue 2',
      holdById: 'user-1',
    });

    // Release the first hold
    await releaseQualityHold.execute({
      qualityHoldId: hold1.id.toString(),
      releasedById: 'user-2',
      resolution: 'Resolved',
    });

    const { qualityHolds: activeHolds } = await sut.execute({
      status: 'ACTIVE',
    });

    expect(activeHolds).toHaveLength(1);

    const { qualityHolds: releasedHolds } = await sut.execute({
      status: 'RELEASED',
    });

    expect(releasedHolds).toHaveLength(1);
  });
});
