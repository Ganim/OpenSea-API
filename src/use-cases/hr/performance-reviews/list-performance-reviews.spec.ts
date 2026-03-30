import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPerformanceReviewsUseCase } from './list-performance-reviews';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: ListPerformanceReviewsUseCase;

const tenantId = new UniqueEntityID().toString();
const reviewCycleId = new UniqueEntityID();

describe('List Performance Reviews Use Case', () => {
  beforeEach(async () => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new ListPerformanceReviewsUseCase(performanceReviewsRepository);

    await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId,
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId,
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });
  });

  it('should list all reviews for a tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.reviews).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by review cycle', async () => {
    const otherCycleId = new UniqueEntityID();
    await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: otherCycleId,
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    const result = await sut.execute({
      tenantId,
      reviewCycleId: reviewCycleId.toString(),
    });

    expect(result.reviews).toHaveLength(2);
  });

  it('should paginate results', async () => {
    const result = await sut.execute({ tenantId, page: 1, perPage: 1 });

    expect(result.reviews).toHaveLength(1);
    expect(result.total).toBe(2);
  });
});
