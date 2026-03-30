import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SubmitManagerReviewUseCase } from './submit-manager-review';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: SubmitManagerReviewUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Submit Manager Review Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new SubmitManagerReviewUseCase(performanceReviewsRepository);
  });

  it('should submit a manager review', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
      status: 'MANAGER_REVIEW',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      managerScore: 4,
      managerComments: 'Excelente colaborador',
      strengths: 'Liderança e comunicação',
      improvements: 'Pontualidade',
      goals: 'Assumir gestão de projeto',
    });

    expect(result.review.status).toBe('COMPLETED');
    expect(result.review.managerScore).toBe(4);
    expect(result.review.completedAt).toBeDefined();
  });

  it('should throw error when status is not MANAGER_REVIEW', async () => {
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
        managerScore: 4,
      }),
    ).rejects.toThrow(
      'A avaliação do gestor só pode ser submetida quando o status for MANAGER_REVIEW',
    );
  });

  it('should throw error for invalid score', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
      status: 'MANAGER_REVIEW',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        managerScore: 0,
      }),
    ).rejects.toThrow('A nota deve ser entre 1 e 5');
  });

  it('should throw error for non-existent review', async () => {
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: new UniqueEntityID().toString(),
        managerScore: 4,
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });
});
