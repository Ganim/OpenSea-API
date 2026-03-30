import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SubmitSelfAssessmentUseCase } from './submit-self-assessment';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: SubmitSelfAssessmentUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Submit Self Assessment Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new SubmitSelfAssessmentUseCase(performanceReviewsRepository);
  });

  it('should submit a self assessment', async () => {
    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reviewerId: new UniqueEntityID(),
      status: 'PENDING',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      selfScore: 4,
      selfComments: 'Bom desempenho no período',
      strengths: 'Proatividade e trabalho em equipe',
      improvements: 'Gestão de tempo',
      goals: 'Certificação PMP',
    });

    expect(result.review.status).toBe('MANAGER_REVIEW');
    expect(result.review.selfScore).toBe(4);
    expect(result.review.selfComments).toBe('Bom desempenho no período');
  });

  it('should throw error for invalid score', async () => {
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
        selfScore: 6,
      }),
    ).rejects.toThrow('A nota deve ser entre 1 e 5');
  });

  it('should throw error when status is not PENDING or SELF_ASSESSMENT', async () => {
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
        selfScore: 4,
      }),
    ).rejects.toThrow(
      'A autoavaliação só pode ser submetida quando o status for PENDING ou SELF_ASSESSMENT',
    );
  });

  it('should throw error for non-existent review', async () => {
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: new UniqueEntityID().toString(),
        selfScore: 4,
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });
});
