import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { InMemoryReviewCompetenciesRepository } from '@/repositories/hr/in-memory/in-memory-review-competencies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateReviewCompetencyUseCase } from './create-review-competency';

let reviewCompetenciesRepository: InMemoryReviewCompetenciesRepository;
let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let sut: CreateReviewCompetencyUseCase;

const tenantId = new UniqueEntityID().toString();

async function seedReview(status = 'PENDING') {
  return performanceReviewsRepository.create({
    tenantId,
    reviewCycleId: new UniqueEntityID(),
    employeeId: new UniqueEntityID(),
    reviewerId: new UniqueEntityID(),
    status,
  });
}

describe('Create Review Competency Use Case', () => {
  beforeEach(() => {
    reviewCompetenciesRepository = new InMemoryReviewCompetenciesRepository();
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    sut = new CreateReviewCompetencyUseCase(
      reviewCompetenciesRepository,
      performanceReviewsRepository,
    );
  });

  it('should create a competency with default weight', async () => {
    const review = await seedReview();

    const { competency } = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      name: 'Técnica',
    });

    expect(competency.name).toBe('Técnica');
    expect(competency.weight).toBe(1.0);
    expect(competency.selfScore).toBeUndefined();
    expect(competency.managerScore).toBeUndefined();
  });

  it('should create a competency with custom weight and scores', async () => {
    const review = await seedReview();

    const { competency } = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      name: 'Liderança',
      weight: 2.5,
      selfScore: 4,
      managerScore: 3.5,
      comments: 'Boa evolução no semestre',
    });

    expect(competency.weight).toBe(2.5);
    expect(competency.selfScore).toBe(4);
    expect(competency.managerScore).toBe(3.5);
    expect(competency.comments).toBe('Boa evolução no semestre');
  });

  it('should reject score above 5', async () => {
    const review = await seedReview();

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        name: 'Comunicação',
        selfScore: 5.5,
      }),
    ).rejects.toThrow(/selfScore.*entre 0 e 5/);
  });

  it('should reject score below 0', async () => {
    const review = await seedReview();

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        name: 'Comunicação',
        managerScore: -1,
      }),
    ).rejects.toThrow(/managerScore.*entre 0 e 5/);
  });

  it('should reject score that is not a 0.5 step', async () => {
    const review = await seedReview();

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        name: 'Comunicação',
        selfScore: 3.7,
      }),
    ).rejects.toThrow(/incrementos de 0.5/);
  });

  it('should reject non-positive weight', async () => {
    const review = await seedReview();

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        name: 'Ownership',
        weight: 0,
      }),
    ).rejects.toThrow(/peso.*positivo/);
  });

  it('should reject empty name', async () => {
    const review = await seedReview();

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        name: '   ',
      }),
    ).rejects.toThrow(/entre 1 e 100 caracteres/);
  });

  it('should throw when review does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: new UniqueEntityID().toString(),
        name: 'Entrega',
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });

  it('should reject creation when review is COMPLETED', async () => {
    const review = await seedReview('COMPLETED');

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        name: 'Entrega',
      }),
    ).rejects.toThrow(/avaliação concluída/);
  });
});
