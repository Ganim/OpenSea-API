import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { InMemoryReviewCompetenciesRepository } from '@/repositories/hr/in-memory/in-memory-review-competencies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListReviewCompetenciesUseCase } from './list-review-competencies';

let reviewCompetenciesRepository: InMemoryReviewCompetenciesRepository;
let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: ListReviewCompetenciesUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Review Competencies Use Case', () => {
  beforeEach(() => {
    reviewCompetenciesRepository = new InMemoryReviewCompetenciesRepository();
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new ListReviewCompetenciesUseCase(
      reviewCompetenciesRepository,
      performanceReviewsRepository,
    );
  });

  it('should list competencies of a review ordered by creation', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: review.id,
      name: 'Técnica',
    });
    await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: review.id,
      name: 'Comunicação',
    });

    const { competencies } = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
    });

    expect(competencies).toHaveLength(2);
    expect(competencies[0].name).toBe('Técnica');
    expect(competencies[1].name).toBe('Comunicação');
  });

  it('should not return soft-deleted competencies', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });

    const created = await reviewCompetenciesRepository.create({
      tenantId,
      reviewId: review.id,
      name: 'Liderança',
    });
    await reviewCompetenciesRepository.softDelete(created.id);

    const { competencies } = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
    });

    expect(competencies).toHaveLength(0);
  });

  it('should isolate by tenant', async () => {
    const otherTenant = new UniqueEntityID().toString();
    const review = await performanceReviewsRepository.create({
      tenantId: otherTenant,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
    });
    await reviewCompetenciesRepository.create({
      tenantId: otherTenant,
      reviewId: review.id,
      name: 'Entrega',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });
});
