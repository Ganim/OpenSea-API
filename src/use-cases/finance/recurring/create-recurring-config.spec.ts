import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryRecurringConfigsRepository } from '@/repositories/finance/in-memory/in-memory-recurring-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateRecurringConfigUseCase } from './create-recurring-config';

let recurringConfigsRepository: InMemoryRecurringConfigsRepository;
let sut: CreateRecurringConfigUseCase;

describe('CreateRecurringConfigUseCase', () => {
  beforeEach(() => {
    recurringConfigsRepository = new InMemoryRecurringConfigsRepository();
    sut = new CreateRecurringConfigUseCase(recurringConfigsRepository);
  });

  it('should create a fixed recurring config', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel mensal',
      categoryId: 'category-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-04-01'),
      createdBy: 'user-1',
    });

    expect(result.config.id).toBeDefined();
    expect(result.config.status).toBe('ACTIVE');
    expect(result.config.isVariable).toBe(false);
    expect(result.config.frequencyInterval).toBe(1);
    expect(result.config.nextDueDate).toEqual(new Date('2026-04-01'));
    expect(result.config.generatedCount).toBe(0);
  });

  it('should create a variable recurring config', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Conta de luz',
      categoryId: 'category-1',
      expectedAmount: 300,
      isVariable: true,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-04-01'),
    });

    expect(result.config.isVariable).toBe(true);
  });

  it('should create with endDate', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      description: 'Mensalidade academia',
      categoryId: 'category-1',
      expectedAmount: 100,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-12-31'),
    });

    expect(result.config.endDate).toEqual(new Date('2026-12-31'));
  });

  it('should create with totalOccurrences', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Parcela equipamento',
      categoryId: 'category-1',
      expectedAmount: 500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-04-01'),
      totalOccurrences: 12,
    });

    expect(result.config.totalOccurrences).toBe(12);
  });

  it('should reject invalid frequency unit', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Test',
        categoryId: 'category-1',
        expectedAmount: 100,
        frequencyUnit: 'INVALID',
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject endDate before startDate', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Test',
        categoryId: 'category-1',
        expectedAmount: 100,
        frequencyUnit: 'MONTHLY',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-03-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject invalid type', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'INVALID',
        description: 'Test',
        categoryId: 'category-1',
        expectedAmount: 100,
        frequencyUnit: 'MONTHLY',
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject zero or negative amount', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Test',
        categoryId: 'category-1',
        expectedAmount: 0,
        frequencyUnit: 'MONTHLY',
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should support all valid frequency units', async () => {
    const validUnits = [
      'WEEKLY',
      'BIWEEKLY',
      'MONTHLY',
      'QUARTERLY',
      'SEMIANNUAL',
      'ANNUAL',
    ];

    for (const unit of validUnits) {
      const result = await sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: `Test ${unit}`,
        categoryId: 'category-1',
        expectedAmount: 100,
        frequencyUnit: unit,
        startDate: new Date('2026-04-01'),
      });

      expect(result.config.frequencyUnit).toBe(unit);
    }
  });
});
