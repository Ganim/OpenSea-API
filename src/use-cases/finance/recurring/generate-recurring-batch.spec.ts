import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryRecurringConfigsRepository } from '@/repositories/finance/in-memory/in-memory-recurring-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateRecurringBatchUseCase } from './generate-recurring-batch';

let recurringConfigsRepository: InMemoryRecurringConfigsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: GenerateRecurringBatchUseCase;

describe('GenerateRecurringBatchUseCase', () => {
  beforeEach(() => {
    recurringConfigsRepository = new InMemoryRecurringConfigsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GenerateRecurringBatchUseCase(
      recurringConfigsRepository,
      financeEntriesRepository,
    );
  });

  it('should generate entries for active configs with due dates', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel mensal',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      frequencyInterval: 1,
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      endDate: new Date('2026-04-30'),
    });

    expect(result.generatedCount).toBeGreaterThan(0);
    expect(financeEntriesRepository.items.length).toBeGreaterThan(0);
  });

  it('should not generate for paused configs', async () => {
    const _config = await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Pausado',
      categoryId: 'cat-1',
      expectedAmount: 100,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-03-01'),
    });

    recurringConfigsRepository.items[0].status = 'PAUSED';

    const result = await sut.execute({
      tenantId: 'tenant-1',
      endDate: new Date('2026-04-30'),
    });

    expect(result.generatedCount).toBe(0);
  });

  it('should advance nextDueDate after generation', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      frequencyInterval: 1,
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-03-01'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      endDate: new Date('2026-04-30'),
    });

    const updatedConfig = recurringConfigsRepository.items[0];
    // Should have advanced past 2026-03-01
    expect(updatedConfig.nextDueDate!.getTime()).toBeGreaterThan(
      new Date('2026-03-01').getTime(),
    );
  });

  it('should increment generatedCount', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      frequencyInterval: 1,
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-03-01'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      endDate: new Date('2026-04-30'),
    });

    const updatedConfig = recurringConfigsRepository.items[0];
    expect(updatedConfig.generatedCount).toBeGreaterThan(0);
  });

  it('should respect totalOccurrences limit', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Limitado',
      categoryId: 'cat-1',
      expectedAmount: 100,
      frequencyUnit: 'MONTHLY',
      frequencyInterval: 1,
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-03-01'),
      totalOccurrences: 1,
    });

    // generatedCount starts at 0, totalOccurrences is 1, so only 1 can be generated
    await sut.execute({
      tenantId: 'tenant-1',
      endDate: new Date('2026-06-30'),
    });

    expect(financeEntriesRepository.items.length).toBe(1);
    expect(recurringConfigsRepository.items[0].generatedCount).toBe(1);
  });

  it('should not generate entries beyond endDate', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Config with end',
      categoryId: 'cat-1',
      expectedAmount: 100,
      frequencyUnit: 'MONTHLY',
      frequencyInterval: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-15'),
      nextDueDate: new Date('2026-03-01'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      endDate: new Date('2026-06-30'),
    });

    // Should generate for March (before endDate) but not April
    const entries = financeEntriesRepository.items;
    expect(entries.length).toBe(1);
    expect(entries[0].dueDate).toEqual(new Date('2026-03-01'));
  });

  it('should handle weekly frequency', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      description: 'Recebimento semanal',
      categoryId: 'cat-1',
      expectedAmount: 200,
      frequencyUnit: 'WEEKLY',
      frequencyInterval: 1,
      startDate: new Date('2026-03-01'),
      nextDueDate: new Date('2026-03-01'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      endDate: new Date('2026-03-15'),
    });

    // Should generate for March 1, 8, 15
    expect(financeEntriesRepository.items.length).toBe(3);
  });

  it('should not generate for configs with nextDueDate beyond endDate', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Futuro',
      categoryId: 'cat-1',
      expectedAmount: 100,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-06-01'),
      nextDueDate: new Date('2026-06-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      endDate: new Date('2026-04-30'),
    });

    expect(result.generatedCount).toBe(0);
  });
});
