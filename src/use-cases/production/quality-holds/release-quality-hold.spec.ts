import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryQualityHoldsRepository } from '@/repositories/production/in-memory/in-memory-quality-holds-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQualityHoldUseCase } from './create-quality-hold';
import { ReleaseQualityHoldUseCase } from './release-quality-hold';

let qualityHoldsRepository: InMemoryQualityHoldsRepository;
let createQualityHold: CreateQualityHoldUseCase;
let sut: ReleaseQualityHoldUseCase;

describe('ReleaseQualityHoldUseCase', () => {
  beforeEach(() => {
    qualityHoldsRepository = new InMemoryQualityHoldsRepository();
    createQualityHold = new CreateQualityHoldUseCase(qualityHoldsRepository);
    sut = new ReleaseQualityHoldUseCase(qualityHoldsRepository);
  });

  it('should release an active quality hold', async () => {
    const { qualityHold: created } = await createQualityHold.execute({
      productionOrderId: 'order-1',
      reason: 'Dimension out of tolerance',
      holdById: 'user-1',
    });

    const { qualityHold } = await sut.execute({
      qualityHoldId: created.id.toString(),
      releasedById: 'user-2',
      resolution: 'Reworked and re-measured within tolerance',
    });

    expect(qualityHold.status).toBe('RELEASED');
    expect(qualityHold.releasedById).toBe('user-2');
    expect(qualityHold.resolution).toBe(
      'Reworked and re-measured within tolerance',
    );
    expect(qualityHold.releasedAt).toBeDefined();
  });

  it('should throw error if quality hold does not exist', async () => {
    await expect(() =>
      sut.execute({
        qualityHoldId: 'non-existent-id',
        releasedById: 'user-2',
        resolution: 'Resolved',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if quality hold is not active', async () => {
    const { qualityHold: created } = await createQualityHold.execute({
      productionOrderId: 'order-1',
      reason: 'Quality issue',
      holdById: 'user-1',
    });

    // Release it
    await sut.execute({
      qualityHoldId: created.id.toString(),
      releasedById: 'user-2',
      resolution: 'Resolved',
    });

    // Try to release again
    await expect(() =>
      sut.execute({
        qualityHoldId: created.id.toString(),
        releasedById: 'user-3',
        resolution: 'Another resolution',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
