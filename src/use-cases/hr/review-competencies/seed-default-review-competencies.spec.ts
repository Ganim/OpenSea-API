import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DEFAULT_REVIEW_COMPETENCIES } from '@/entities/hr/review-competency';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { InMemoryReviewCompetenciesRepository } from '@/repositories/hr/in-memory/in-memory-review-competencies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeedDefaultReviewCompetenciesUseCase } from './seed-default-review-competencies';

let reviewCompetenciesRepository: InMemoryReviewCompetenciesRepository;
let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: SeedDefaultReviewCompetenciesUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Seed Default Review Competencies Use Case', () => {
  beforeEach(() => {
    reviewCompetenciesRepository = new InMemoryReviewCompetenciesRepository();
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new SeedDefaultReviewCompetenciesUseCase(
      reviewCompetenciesRepository,
      performanceReviewsRepository,
    );
  });

  it('should create the 5 default competencies when none exist', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
    });

    expect(result.createdCount).toBe(DEFAULT_REVIEW_COMPETENCIES.length);
    expect(result.alreadyExistedCount).toBe(0);
    expect(result.competencies).toHaveLength(
      DEFAULT_REVIEW_COMPETENCIES.length,
    );

    const names = result.competencies
      .map((competency) => competency.name)
      .sort();
    expect(names).toEqual([...DEFAULT_REVIEW_COMPETENCIES].sort());
  });

  it('should be idempotent and skip existing defaults (case-insensitive)', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: review.id,
      name: 'técnica',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
    });

    expect(result.alreadyExistedCount).toBe(1);
    expect(result.createdCount).toBe(DEFAULT_REVIEW_COMPETENCIES.length - 1);
  });

  it('should reject seeding when review is COMPLETED', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
      }),
    ).rejects.toThrow(/avaliação concluída/);
  });
});
