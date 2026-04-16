import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { InMemoryReviewCompetenciesRepository } from '@/repositories/hr/in-memory/in-memory-review-competencies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateReviewCompetencyUseCase } from './update-review-competency';

let reviewCompetenciesRepository: InMemoryReviewCompetenciesRepository;
let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: UpdateReviewCompetencyUseCase;

const tenantId = new UniqueEntityID().toString();

async function setupReviewWithCompetency(status = 'PENDING') {
  const review = await performanceReviewsRepository.create({
    tenantId,
    reviewCycleId: new UniqueEntityID(),
    employeeId: new UniqueEntityID(),
    reviewerId: new UniqueEntityID(),
    status,
  });
  const competency = await reviewCompetenciesRepository.create({
    tenantId,
    reviewId: review.id,
    name: 'Técnica',
  });
  return { review, competency };
}

describe('Update Review Competency Use Case', () => {
  beforeEach(() => {
    reviewCompetenciesRepository = new InMemoryReviewCompetenciesRepository();
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new UpdateReviewCompetencyUseCase(
      reviewCompetenciesRepository,
      performanceReviewsRepository,
    );
  });

  it('should update self and manager scores', async () => {
    const { review, competency } = await setupReviewWithCompetency();

    const { competency: updated } = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      competencyId: competency.id.toString(),
      selfScore: 4.5,
      managerScore: 4,
    });

    expect(updated.selfScore).toBe(4.5);
    expect(updated.managerScore).toBe(4);
  });

  it('should update name and weight', async () => {
    const { review, competency } = await setupReviewWithCompetency();

    const { competency: updated } = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      competencyId: competency.id.toString(),
      name: 'Comunicação',
      weight: 2,
    });

    expect(updated.name).toBe('Comunicação');
    expect(updated.weight).toBe(2);
  });

  it('should clear scores when null is provided', async () => {
    const { review, competency } = await setupReviewWithCompetency();
    await reviewCompetenciesRepository.update({
      id: competency.id,
      selfScore: 3,
      managerScore: 4,
    });

    const { competency: updated } = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      competencyId: competency.id.toString(),
      selfScore: null,
      managerScore: null,
    });

    expect(updated.selfScore).toBeUndefined();
    expect(updated.managerScore).toBeUndefined();
  });

  it('should reject invalid score', async () => {
    const { review, competency } = await setupReviewWithCompetency();

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        competencyId: competency.id.toString(),
        managerScore: 6,
      }),
    ).rejects.toThrow(/managerScore.*entre 0 e 5/);
  });

  it('should reject update when review is COMPLETED', async () => {
    const { review, competency } = await setupReviewWithCompetency('COMPLETED');

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        competencyId: competency.id.toString(),
        selfScore: 3,
      }),
    ).rejects.toThrow(/avaliação concluída/);
  });

  it('should reject competency from another review', async () => {
    const { competency } = await setupReviewWithCompetency();
    const otherReview = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: otherReview.id.toString(),
        competencyId: competency.id.toString(),
        selfScore: 3,
      }),
    ).rejects.toThrow(/não pertence/);
  });
});
