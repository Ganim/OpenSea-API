import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryRecurringConfigsRepository } from '@/repositories/finance/in-memory/in-memory-recurring-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelRecurringUseCase } from './cancel-recurring';

let recurringConfigsRepository: InMemoryRecurringConfigsRepository;
let sut: CancelRecurringUseCase;

describe('CancelRecurringUseCase', () => {
  beforeEach(() => {
    recurringConfigsRepository = new InMemoryRecurringConfigsRepository();
    sut = new CancelRecurringUseCase(recurringConfigsRepository);
  });

  it('should cancel an active recurring config', async () => {
    const config = await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
    });

    const result = await sut.execute({
      id: config.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.config.status).toBe('CANCELLED');
  });

  it('should cancel a paused config', async () => {
    const config = await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
    });

    recurringConfigsRepository.items[0].status = 'PAUSED';

    const result = await sut.execute({
      id: config.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.config.status).toBe('CANCELLED');
  });

  it('should fail if already cancelled', async () => {
    const config = await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
    });

    recurringConfigsRepository.items[0].status = 'CANCELLED';

    await expect(
      sut.execute({
        id: config.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail if not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
