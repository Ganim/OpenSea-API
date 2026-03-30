import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryReviewCyclesRepository } from '@/repositories/hr/in-memory/in-memory-review-cycles-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { OpenReviewCycleUseCase } from './open-review-cycle';

let reviewCyclesRepository: InMemoryReviewCyclesRepository;
let sut: OpenReviewCycleUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Open Review Cycle Use Case', () => {
  beforeEach(() => {
    reviewCyclesRepository = new InMemoryReviewCyclesRepository();
    sut = new OpenReviewCycleUseCase(reviewCyclesRepository);
  });

  it('should open a draft review cycle', async () => {
    const created = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'DRAFT',
    });

    const result = await sut.execute({
      tenantId,
      reviewCycleId: created.id.toString(),
    });

    expect(result.reviewCycle.status).toBe('OPEN');
  });

  it('should throw error when cycle is not in DRAFT status', async () => {
    const created = await reviewCyclesRepository.create({
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
        reviewCycleId: created.id.toString(),
      }),
    ).rejects.toThrow('Apenas ciclos em rascunho podem ser abertos');
  });

  it('should throw error for non-existent cycle', async () => {
    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Ciclo de avaliação não encontrado');
  });
});
