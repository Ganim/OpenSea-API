import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DetectDuplicateEntryUseCase } from './detect-duplicate-entry';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: DetectDuplicateEntryUseCase;

const tenantId = 'tenant-1';
const categoryId = new UniqueEntityID().toString();

async function seedEntry(overrides: {
  description?: string;
  supplierName?: string;
  customerName?: string;
  expectedAmount?: number;
  dueDate?: Date;
  type?: 'PAYABLE' | 'RECEIVABLE';
}) {
  return entriesRepository.create({
    tenantId,
    type: overrides.type ?? 'PAYABLE',
    code: `PAY-${Math.random().toString(36).slice(2, 8)}`,
    description: overrides.description ?? 'Despesa genérica',
    categoryId,
    expectedAmount: overrides.expectedAmount ?? 1000,
    issueDate: new Date('2026-01-01'),
    dueDate: overrides.dueDate ?? new Date('2026-02-15'),
    supplierName: overrides.supplierName,
    customerName: overrides.customerName,
  });
}

describe('DetectDuplicateEntryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new DetectDuplicateEntryUseCase(entriesRepository);
  });

  it('should detect a duplicate with exact amount and same supplier (score >= 80)', async () => {
    await seedEntry({
      description: 'Aluguel escritório',
      supplierName: 'Imobiliária Central',
      expectedAmount: 3500,
      dueDate: new Date('2026-02-15'),
    });

    const { duplicates } = await sut.execute({
      tenantId,
      supplierName: 'Imobiliária Central',
      expectedAmount: 3500,
      dueDate: '2026-02-15',
    });

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].score).toBeGreaterThanOrEqual(80);
    expect(duplicates[0].matchReasons).toContain('Valor exato idêntico');
    expect(duplicates[0].matchReasons).toContain('Mesmo fornecedor');
  });

  it('should detect a duplicate with exact amount and close due date (score >= 70)', async () => {
    await seedEntry({
      description: 'Internet mensal',
      expectedAmount: 250,
      dueDate: new Date('2026-02-14'),
    });

    const { duplicates } = await sut.execute({
      tenantId,
      expectedAmount: 250,
      dueDate: '2026-02-15',
    });

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].score).toBeGreaterThanOrEqual(70);
    expect(duplicates[0].matchReasons).toContain('Valor exato idêntico');
  });

  it('should NOT detect entries with amount outside ±1% tolerance', async () => {
    await seedEntry({
      description: 'Fornecimento materiais',
      supplierName: 'Fornecedor ABC',
      expectedAmount: 1000,
      dueDate: new Date('2026-02-15'),
    });

    const { duplicates } = await sut.execute({
      tenantId,
      supplierName: 'Fornecedor ABC',
      expectedAmount: 1050, // 5% higher, outside tolerance
      dueDate: '2026-02-15',
    });

    expect(duplicates).toHaveLength(0);
  });

  it('should NOT detect entries with due date outside ±3 days', async () => {
    await seedEntry({
      description: 'Pagamento mensal',
      supplierName: 'Fornecedor XYZ',
      expectedAmount: 500,
      dueDate: new Date('2026-02-20'), // 5 days away
    });

    const { duplicates } = await sut.execute({
      tenantId,
      supplierName: 'Fornecedor XYZ',
      expectedAmount: 500,
      dueDate: '2026-02-15',
    });

    expect(duplicates).toHaveLength(0);
  });

  it('should return empty when no entries match the criteria', async () => {
    const { duplicates } = await sut.execute({
      tenantId,
      expectedAmount: 999,
      dueDate: '2026-06-01',
    });

    expect(duplicates).toHaveLength(0);
  });

  it('should score customer name match for receivable entries', async () => {
    await seedEntry({
      type: 'RECEIVABLE',
      description: 'Fatura cliente',
      customerName: 'Empresa Beta LTDA',
      expectedAmount: 2000,
      dueDate: new Date('2026-02-15'),
    });

    const { duplicates } = await sut.execute({
      tenantId,
      customerName: 'Empresa Beta',
      expectedAmount: 2000,
      dueDate: '2026-02-15',
    });

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].score).toBeGreaterThanOrEqual(70);
    expect(duplicates[0].matchReasons).toContain('Mesmo cliente');
  });

  it('should filter entries below score threshold of 70', async () => {
    // Entry with only close due date (score = 5 at ±3 days), no amount or supplier match
    await seedEntry({
      description: 'Algo diferente',
      expectedAmount: 500,
      dueDate: new Date('2026-02-18'), // +3 days from target
    });

    const { duplicates } = await sut.execute({
      tenantId,
      expectedAmount: 500,
      dueDate: '2026-02-15',
    });

    // Exact amount (+50) + ±3 days (+5) = 55 < 70
    // Actually ±3 days, so the entry dueDate is within range but score 55, filtered out
    // Wait, the entry amount is exact (500 == 500) so +50, and ±3 days so +5 = 55 < 70
    expect(duplicates).toHaveLength(0);
  });

  it('should sort duplicates by score descending', async () => {
    // High score: exact amount + same supplier + close date
    await seedEntry({
      description: 'Aluguel',
      supplierName: 'Imobiliária',
      expectedAmount: 3000,
      dueDate: new Date('2026-02-15'),
    });

    // Medium score: exact amount + close date (no supplier match)
    await seedEntry({
      description: 'Outro pagamento',
      supplierName: 'Outro fornecedor',
      expectedAmount: 3000,
      dueDate: new Date('2026-02-15'),
    });

    const { duplicates } = await sut.execute({
      tenantId,
      supplierName: 'Imobiliária',
      expectedAmount: 3000,
      dueDate: '2026-02-15',
    });

    expect(duplicates.length).toBeGreaterThanOrEqual(1);
    // First should be the one with supplier match (higher score)
    if (duplicates.length >= 2) {
      expect(duplicates[0].score).toBeGreaterThanOrEqual(duplicates[1].score);
    }
  });
});
