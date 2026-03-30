import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPerformanceReviewUseCase } from './get-performance-review';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: GetPerformanceReviewUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Performance Review Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new GetPerformanceReviewUseCase(performanceReviewsRepository);
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
