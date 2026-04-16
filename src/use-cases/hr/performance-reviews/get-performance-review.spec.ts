import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { InMemoryReviewCompetenciesRepository } from '@/repositories/hr/in-memory/in-memory-review-competencies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPerformanceReviewUseCase } from './get-performance-review';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let reviewCompetenciesRepository: InMemoryReviewCompetenciesRepository;
let sut: GetPerformanceReviewUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Performance Review Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    reviewCompetenciesRepository = new InMemoryReviewCompetenciesRepository();
    sut = new GetPerformanceReviewUseCase(
      performanceReviewsRepository,
      reviewCompetenciesRepository,
    );
  });

  it('should get a performance review by id', async () => {
    const created = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: created.id.toString(),
    });

    expect(result.review).toBeDefined();
    expect(result.review.status).toBe('PENDING');
    expect(result.competencies).toEqual([]);
    expect(result.aggregatedSelfScore).toBeNull();
    expect(result.aggregatedManagerScore).toBeNull();
  });

  it('should include competencies and weighted aggregated scores', async () => {
    const created = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });
    await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: created.id,
      name: 'Técnica',
      selfScore: 4,
      managerScore: 5,
      weight: 2,
    });
    await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: created.id,
      name: 'Comunicação',
      selfScore: 3,
      managerScore: 4,
      weight: 1,
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: created.id.toString(),
    });

    expect(result.competencies).toHaveLength(2);
    expect(result.aggregatedSelfScore).toBe(3.67);
    expect(result.aggregatedManagerScore).toBe(4.67);
  });

  it('should work without competencies repository injected', async () => {
    const sutWithoutCompetencies = new GetPerformanceReviewUseCase(
      performanceReviewsRepository,
    );

    const created = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    const result = await sutWithoutCompetencies.execute({
      tenantId,
      performanceReviewId: created.id.toString(),
    });

    expect(result.competencies).toEqual([]);
    expect(result.aggregatedSelfScore).toBeNull();
    expect(result.aggregatedManagerScore).toBeNull();
  });

  it('should throw error for non-existent review', async () => {
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });
});
