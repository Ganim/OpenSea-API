import { InMemoryQualityHoldsRepository } from '@/repositories/production/in-memory/in-memory-quality-holds-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQualityHoldUseCase } from './create-quality-hold';

let qualityHoldsRepository: InMemoryQualityHoldsRepository;
let sut: CreateQualityHoldUseCase;

describe('CreateQualityHoldUseCase', () => {
  beforeEach(() => {
    qualityHoldsRepository = new InMemoryQualityHoldsRepository();
    sut = new CreateQualityHoldUseCase(qualityHoldsRepository);
  });

  it('should create a quality hold', async () => {
    const { qualityHold } = await sut.execute({
      productionOrderId: 'order-1',
      reason: 'Failed dimension check',
      holdById: 'user-1',
    });

    expect(qualityHold.id.toString()).toEqual(expect.any(String));
    expect(qualityHold.productionOrderId.toString()).toBe('order-1');
    expect(qualityHold.reason).toBe('Failed dimension check');
    expect(qualityHold.holdById).toBe('user-1');
    expect(qualityHold.status).toBe('ACTIVE');
    expect(qualityHold.releasedById).toBeNull();
    expect(qualityHold.releasedAt).toBeNull();
    expect(qualityHold.resolution).toBeNull();
  });

  it('should set holdAt to current time', async () => {
    const before = new Date();

    const { qualityHold } = await sut.execute({
      productionOrderId: 'order-1',
      reason: 'Quality issue',
      holdById: 'user-1',
    });

    const after = new Date();

    expect(qualityHold.holdAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(qualityHold.holdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
