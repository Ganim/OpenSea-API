import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { InMemoryReviewCompetenciesRepository } from '@/repositories/hr/in-memory/in-memory-review-competencies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteReviewCompetencyUseCase } from './delete-review-competency';

let reviewCompetenciesRepository: InMemoryReviewCompetenciesRepository;
let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: DeleteReviewCompetencyUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Review Competency Use Case', () => {
  beforeEach(() => {
    reviewCompetenciesRepository = new InMemoryReviewCompetenciesRepository();
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new DeleteReviewCompetencyUseCase(
      reviewCompetenciesRepository,
      performanceReviewsRepository,
    );
  });

  it('should soft delete a competency', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });
    const competency = await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: review.id,
      name: 'Liderança',
    });

    await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      competencyId: competency.id.toString(),
    });

    const remaining = await reviewCompetenciesRepository.findManyByReview(
      review.id,
      tenantId,
    );
    expect(remaining).toHaveLength(0);
    expect(reviewCompetenciesRepository.items[0].isDeleted()).toBe(true);
  });

  it('should reject deletion when review is COMPLETED', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
      status: 'COMPLETED',
    });
    const competency = await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: review.id,
      name: 'Entrega',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        competencyId: competency.id.toString(),
      }),
    ).rejects.toThrow(/avaliação concluída/);
  });

  it('should reject when competency belongs to another review', async () => {
    const reviewA = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });
    const reviewB = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });
    const competency = await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: reviewA.id,
      name: 'Ownership',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: reviewB.id.toString(),
        competencyId: competency.id.toString(),
      }),
    ).rejects.toThrow(/não pertence/);
  });
});
