import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryReviewCyclesRepository } from '@/repositories/hr/in-memory/in-memory-review-cycles-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetReviewCycleUseCase } from './get-review-cycle';

let reviewCyclesRepository: InMemoryReviewCyclesRepository;
let sut: GetReviewCycleUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Review Cycle Use Case', () => {
  beforeEach(() => {
    reviewCyclesRepository = new InMemoryReviewCyclesRepository();
    sut = new GetReviewCycleUseCase(reviewCyclesRepository);
  });

  it('should get a review cycle by id', async () => {
    const created = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    const result = await sut.execute({
      tenantId,
      reviewCycleId: created.id.toString(),
    });

    expect(result.reviewCycle.name).toBe('Avaliação Anual 2026');
  });

  it('should throw error for non-existent cycle', async () => {
    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Ciclo de avaliação não encontrado');
  });
});
