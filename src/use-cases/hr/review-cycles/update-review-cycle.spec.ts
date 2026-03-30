import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryReviewCyclesRepository } from '@/repositories/hr/in-memory/in-memory-review-cycles-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateReviewCycleUseCase } from './update-review-cycle';

let reviewCyclesRepository: InMemoryReviewCyclesRepository;
let sut: UpdateReviewCycleUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Review Cycle Use Case', () => {
  beforeEach(() => {
    reviewCyclesRepository = new InMemoryReviewCyclesRepository();
    sut = new UpdateReviewCycleUseCase(reviewCyclesRepository);
  });

  it('should update a review cycle', async () => {
    const created = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    const result = await sut.execute({
      tenantId,
      reviewCycleId: created.id.toString(),
      name: 'Avaliação Anual 2026 - Atualizada',
      description: 'Descrição atualizada',
    });

    expect(result.reviewCycle.name).toBe('Avaliação Anual 2026 - Atualizada');
    expect(result.reviewCycle.description).toBe('Descrição atualizada');
  });

  it('should throw error for non-existent cycle', async () => {
    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: new UniqueEntityID().toString(),
        name: 'Updated',
      }),
    ).rejects.toThrow('Ciclo de avaliação não encontrado');
  });

  it('should throw error for empty name', async () => {
    const created = await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    await expect(
      sut.execute({
        tenantId,
        reviewCycleId: created.id.toString(),
        name: '   ',
      }),
    ).rejects.toThrow('O nome do ciclo de avaliação é obrigatório');
  });
});
