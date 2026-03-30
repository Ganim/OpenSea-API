import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryReviewCyclesRepository } from '@/repositories/hr/in-memory/in-memory-review-cycles-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CloseReviewCycleUseCase } from './close-review-cycle';

let reviewCyclesRepository: InMemoryReviewCyclesRepository;
let sut: CloseReviewCycleUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Close Review Cycle Use Case', () => {
  beforeEach(() => {
    reviewCyclesRepository = new InMemoryReviewCyclesRepository();
    sut = new CloseReviewCycleUseCase(reviewCyclesRepository);
  });

  it('should close an open review cycle', async () => {
    const created = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'OPEN',
    });

    const result = await sut.execute({
      tenantId,
      reviewCycleId: created.id.toString(),
    });

    expect(result.reviewCycle.status).toBe('CLOSED');
  });

  it('should throw error when cycle is already closed', async () => {
    const created = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'CLOSED',
    });

    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: created.id.toString(),
      }),
    ).rejects.toThrow('O ciclo de avaliação já está fechado');
  });

  it('should throw error when cycle is in DRAFT status', async () => {
    const created = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'DRAFT',
    });

    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: created.id.toString(),
      }),
    ).rejects.toThrow(
      'Não é possível fechar um ciclo em rascunho',
    );
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
