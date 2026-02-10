import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateRecurringEntriesUseCase } from './generate-recurring-entries';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: GenerateRecurringEntriesUseCase;

describe('GenerateRecurringEntriesUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GenerateRecurringEntriesUseCase(entriesRepository);
  });

  it('should generate 12 monthly installments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      parentEntryId: 'parent-1',
      type: 'PAYABLE',
      description: 'Financiamento',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 12000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      totalInstallments: 12,
    });

    expect(result.entries).toHaveLength(12);
    expect(entriesRepository.items).toHaveLength(12);

    // Each installment should be R$1000
    for (const entry of result.entries) {
      expect(entry.expectedAmount).toBe(1000);
      expect(entry.recurrenceType).toBe('INSTALLMENT');
    }

    // Check description pattern
    expect(result.entries[0].description).toBe('Financiamento (1/12)');
    expect(result.entries[11].description).toBe('Financiamento (12/12)');

    // Check installment numbers
    expect(result.entries[0].currentInstallment).toBe(1);
    expect(result.entries[5].currentInstallment).toBe(6);
    expect(result.entries[11].currentInstallment).toBe(12);
  });

  it('should calculate monthly due dates correctly', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      parentEntryId: 'parent-1',
      type: 'PAYABLE',
      description: 'Parcela',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-15'),
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      totalInstallments: 3,
    });

    expect(result.entries[0].dueDate).toEqual(new Date('2026-02-15'));
    expect(result.entries[1].dueDate).toEqual(new Date('2026-03-15'));
    expect(result.entries[2].dueDate).toEqual(new Date('2026-04-15'));
  });

  it('should generate weekly installments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      parentEntryId: 'parent-1',
      type: 'RECEIVABLE',
      description: 'Pagamento semanal',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 400,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-07'),
      recurrenceInterval: 1,
      recurrenceUnit: 'WEEKLY',
      totalInstallments: 4,
    });

    expect(result.entries).toHaveLength(4);
    expect(result.entries[0].expectedAmount).toBe(100);

    // Check 7-day intervals
    const d0 = new Date(result.entries[0].dueDate).getTime();
    const d1 = new Date(result.entries[1].dueDate).getTime();
    expect(d1 - d0).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should set parentEntryId on all installments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      parentEntryId: 'master-entry-123',
      type: 'PAYABLE',
      description: 'Teste',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 600,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      totalInstallments: 3,
    });

    for (const entry of result.entries) {
      expect(entry.parentEntryId).toBe('master-entry-123');
    }
  });

  it('should auto-generate codes for each installment', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      parentEntryId: 'parent-1',
      type: 'PAYABLE',
      description: 'Parcela',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 300,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      totalInstallments: 3,
    });

    expect(result.entries[0].code).toBe('PAG-001');
    expect(result.entries[1].code).toBe('PAG-002');
    expect(result.entries[2].code).toBe('PAG-003');
  });

  it('should generate quarterly installments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      parentEntryId: 'parent-1',
      type: 'PAYABLE',
      description: 'IPTU',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 4000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-03-01'),
      recurrenceInterval: 1,
      recurrenceUnit: 'QUARTERLY',
      totalInstallments: 4,
    });

    expect(result.entries).toHaveLength(4);
    expect(result.entries[0].dueDate).toEqual(new Date('2026-03-01'));
    expect(result.entries[1].dueDate).toEqual(new Date('2026-06-01'));
    expect(result.entries[2].dueDate).toEqual(new Date('2026-09-01'));
    expect(result.entries[3].dueDate).toEqual(new Date('2026-12-01'));
  });
});
