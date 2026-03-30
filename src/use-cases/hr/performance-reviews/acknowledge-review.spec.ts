import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AcknowledgeReviewUseCase } from './acknowledge-review';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: AcknowledgeReviewUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Acknowledge Review Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new AcknowledgeReviewUseCase(performanceReviewsRepository);
  });

  it('should acknowledge a completed review', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
      status: 'COMPLETED',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
    });

    expect(result.review.employeeAcknowledged).toBe(true);
    expect(result.review.acknowledgedAt).toBeDefined();
  });

  it('should throw error when review is not completed', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
      status: 'PENDING',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
      }),
    ).rejects.toThrow(
      'Apenas avaliações concluídas podem ser reconhecidas pelo funcionário',
    );
  });

  it('should throw error when already acknowledged', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
      status: 'COMPLETED',
    });

    // First acknowledge
    await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
    });

    // Second acknowledge should fail
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
      }),
    ).rejects.toThrow('Esta avaliação já foi reconhecida pelo funcionário');
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
