import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryRecurringConfigsRepository } from '@/repositories/finance/in-memory/in-memory-recurring-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateRecurringConfigUseCase } from './update-recurring-config';

let recurringConfigsRepository: InMemoryRecurringConfigsRepository;
let sut: UpdateRecurringConfigUseCase;

describe('UpdateRecurringConfigUseCase', () => {
  beforeEach(() => {
    recurringConfigsRepository = new InMemoryRecurringConfigsRepository();
    sut = new UpdateRecurringConfigUseCase(recurringConfigsRepository);
  });

  it('should update mutable fields', async () => {
    const config = await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
    });

    const result = await sut.execute({
      id: config.id.toString(),
      tenantId: 'tenant-1',
      description: 'Aluguel atualizado',
      expectedAmount: 3000,
    });

    expect(result.config.description).toBe('Aluguel atualizado');
    expect(result.config.expectedAmount).toBe(3000);
  });

  it('should not update a cancelled config', async () => {
    const config = await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Cancelada',
      categoryId: 'cat-1',
      expectedAmount: 100,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
    });

    recurringConfigsRepository.items[0].status = 'CANCELLED';

    await expect(
      sut.execute({
        id: config.id.toString(),
        tenantId: 'tenant-1',
        description: 'Update attempt',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if config not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
        description: 'Test',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should update interest and penalty rates', async () => {
    const config = await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Test',
      categoryId: 'cat-1',
      expectedAmount: 100,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
    });

    const result = await sut.execute({
      id: config.id.toString(),
      tenantId: 'tenant-1',
      interestRate: 0.02,
      penaltyRate: 0.01,
    });

    expect(result.config.interestRate).toBe(0.02);
    expect(result.config.penaltyRate).toBe(0.01);
  });
});
