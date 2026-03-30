import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { InMemoryReviewCyclesRepository } from '@/repositories/hr/in-memory/in-memory-review-cycles-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBulkReviewsUseCase } from './create-bulk-reviews';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let reviewCyclesRepository: InMemoryReviewCyclesRepository;
let sut: CreateBulkReviewsUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Bulk Reviews Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    reviewCyclesRepository = new InMemoryReviewCyclesRepository();
    sut = new CreateBulkReviewsUseCase(
      performanceReviewsRepository,
      reviewCyclesRepository,
    );
  });

  it('should create multiple reviews for a cycle', async () => {
    const cycle = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'OPEN',
    });

    const employeeId1 = new UniqueEntityID().toString();
    const employeeId2 = new UniqueEntityID().toString();
    const reviewerId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      reviewCycleId: cycle.id.toString(),
      assignments: [
        { employeeId: employeeId1, reviewerId },
        { employeeId: employeeId2, reviewerId },
      ],
    });

    expect(result.reviews).toHaveLength(2);
    expect(result.reviews[0].status).toBe('PENDING');
    expect(performanceReviewsRepository.items).toHaveLength(2);
  });

  it('should throw error for non-existent cycle', async () => {
    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: new UniqueEntityID().toString(),
        assignments: [
          {
            employeeId: new UniqueEntityID().toString(),
            reviewerId: new UniqueEntityID().toString(),
          },
        ],
      }),
    ).rejects.toThrow('Ciclo de avaliação não encontrado');
  });

  it('should throw error for closed cycle', async () => {
    const cycle = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Fechada',
      type: 'ANNUAL',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'CLOSED',
    });

    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: cycle.id.toString(),
        assignments: [
          {
            employeeId: new UniqueEntityID().toString(),
            reviewerId: new UniqueEntityID().toString(),
          },
        ],
      }),
    ).rejects.toThrow('Não é possível criar avaliações em um ciclo fechado');
  });

  it('should throw error for empty assignments', async () => {
    const cycle = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'OPEN',
    });

    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: cycle.id.toString(),
        assignments: [],
      }),
    ).rejects.toThrow('É necessário informar pelo menos uma atribuição');
  });
});
