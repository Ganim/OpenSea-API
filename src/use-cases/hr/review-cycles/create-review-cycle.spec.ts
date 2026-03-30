import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryReviewCyclesRepository } from '@/repositories/hr/in-memory/in-memory-review-cycles-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateReviewCycleUseCase } from './create-review-cycle';

let reviewCyclesRepository: InMemoryReviewCyclesRepository;
let sut: CreateReviewCycleUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Review Cycle Use Case', () => {
  beforeEach(() => {
    reviewCyclesRepository = new InMemoryReviewCyclesRepository();
    sut = new CreateReviewCycleUseCase(reviewCyclesRepository);
  });

  it('should create a review cycle successfully', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      description: 'Ciclo de avaliação anual',
    });

    expect(result.reviewCycle).toBeDefined();
    expect(result.reviewCycle.name).toBe('Avaliação Anual 2026');
    expect(result.reviewCycle.type).toBe('ANNUAL');
    expect(result.reviewCycle.status).toBe('DRAFT');
    expect(result.reviewCycle.isActive).toBe(true);
    expect(reviewCyclesRepository.items).toHaveLength(1);
  });

  it('should throw error for empty name', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '',
        type: 'ANNUAL',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      }),
    ).rejects.toThrow('O nome do ciclo de avaliação é obrigatório');
  });

  it('should throw error for invalid type', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Test Cycle',
        type: 'INVALID_TYPE',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      }),
    ).rejects.toThrow('Tipo inválido');
  });

  it('should throw error when end date is before start date', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Test Cycle',
        type: 'ANNUAL',
        startDate: new Date('2026-12-31'),
        endDate: new Date('2026-01-01'),
      }),
    ).rejects.toThrow('A data de fim deve ser posterior à data de início');
  });

  it('should trim whitespace from name', async () => {
    const result = await sut.execute({
      tenantId,
      name: '  Avaliação Trimestral Q1  ',
      type: 'QUARTERLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    expect(result.reviewCycle.name).toBe('Avaliação Trimestral Q1');
  });

  it('should create multiple cycles for the same tenant', async () => {
    await sut.execute({
      tenantId,
      name: 'Cycle Q1',
      type: 'QUARTERLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });
    await sut.execute({
      tenantId,
      name: 'Cycle Q2',
      type: 'QUARTERLY',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    expect(reviewCyclesRepository.items).toHaveLength(2);
  });
});
