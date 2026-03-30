import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryReviewCyclesRepository } from '@/repositories/hr/in-memory/in-memory-review-cycles-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteReviewCycleUseCase } from './delete-review-cycle';

let reviewCyclesRepository: InMemoryReviewCyclesRepository;
let sut: DeleteReviewCycleUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Review Cycle Use Case', () => {
  beforeEach(() => {
    reviewCyclesRepository = new InMemoryReviewCyclesRepository();
    sut = new DeleteReviewCycleUseCase(reviewCyclesRepository);
  });

  it('should soft delete a review cycle', async () => {
    const created = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    await sut.execute({
      tenantId,
      reviewCycleId: created.id.toString(),
    });

    const found = await reviewCyclesRepository.findById(
      created.id,
      tenantId,
    );
    expect(found).toBeNull();
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
