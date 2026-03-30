import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import { FinanceEntry } from '@/entities/finance/finance-entry';
import { describe, expect, it } from 'vitest';
import {
  autoMatchTransactions,
  calculateMatchScore,
} from './auto-match-transactions';

function createTestItem(
  overrides: Partial<{
    id: string;
    fitId: string;
    transactionDate: Date;
    amount: number;
    description: string;
    type: 'DEBIT' | 'CREDIT';
  }> = {},
): BankReconciliationItem {
  return BankReconciliationItem.create(
    {
      reconciliationId: new UniqueEntityID('rec-1'),
      fitId: overrides.fitId ?? 'FIT001',
      transactionDate: overrides.transactionDate ?? new Date('2026-03-05'),
      amount: overrides.amount ?? 150.0,
      description: overrides.description ?? 'PIX ENVIADO',
      type: overrides.type ?? 'DEBIT',
    },
    overrides.id ? new UniqueEntityID(overrides.id) : undefined,
  );
}

function createTestEntry(
  overrides: Partial<{
    id: string;
    type: 'PAYABLE' | 'RECEIVABLE';
    expectedAmount: number;
    dueDate: Date;
    description: string;
    supplierName: string;
    customerName: string;
  }> = {},
): FinanceEntry {
  return FinanceEntry.create(
    {
      tenantId: new UniqueEntityID('tenant-1'),
      type: overrides.type ?? 'PAYABLE',
      code: 'PAY-001',
      description: overrides.description ?? 'Pagamento fornecedor',
      categoryId: new UniqueEntityID('cat-1'),
      expectedAmount: overrides.expectedAmount ?? 150.0,
      issueDate: new Date('2026-03-01'),
      dueDate: overrides.dueDate ?? new Date('2026-03-05'),
      supplierName: overrides.supplierName,
      customerName: overrides.customerName,
    },
    overrides.id ? new UniqueEntityID(overrides.id) : undefined,
  );
}

describe('autoMatchTransactions', () => {
  it('should match items with identical amount, date, and type', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 150.0,
        transactionDate: new Date('2026-03-05'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 150.0,
        dueDate: new Date('2026-03-05'),
        type: 'PAYABLE',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    expect(results.size).toBe(1);
    expect(results.get('item-1')?.entryId).toBe('entry-1');
    expect(results.get('item-1')?.confidence).toBeGreaterThan(0.6);
  });

  it('should not match when amount differs significantly', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 150.0,
        transactionDate: new Date('2026-03-05'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 999.0,
        dueDate: new Date('2026-12-25'),
        type: 'RECEIVABLE',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    expect(results.size).toBe(0);
  });

  it('should perform one-to-one matching', () => {
    const items = [
      createTestItem({ id: 'item-1', amount: 100 }),
      createTestItem({ id: 'item-2', amount: 100 }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 100,
        dueDate: new Date('2026-03-05'),
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    // Only one item should match the single entry
    expect(results.size).toBe(1);
  });

  it('should match with description containing supplier name', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 200.0,
        description: 'PIX ENVIADO - FORNECEDOR ABC',
        transactionDate: new Date('2026-03-05'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 200.0,
        dueDate: new Date('2026-03-05'),
        type: 'PAYABLE',
        supplierName: 'fornecedor abc',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    expect(results.size).toBe(1);
    expect(results.get('item-1')?.confidence).toBeGreaterThan(0.8);
  });

  it('should match within 3-day date window when description also matches', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 300.0,
        description: 'Pagamento Aluguel Escritorio',
        transactionDate: new Date('2026-03-07'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 300.0,
        dueDate: new Date('2026-03-05'),
        type: 'PAYABLE',
        description: 'Pagamento Aluguel Escritório',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    // Amount exact (40) + date within 3 days (15) + description high (25) + type (10) = 90
    expect(results.size).toBe(1);
  });

  // ===== NEW: Fuzzy description matching tests =====

  it('should match with high similarity descriptions', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 500.0,
        description: 'Pagamento Fornecedor ABC LTDA',
        transactionDate: new Date('2026-03-05'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 500.0,
        dueDate: new Date('2026-03-05'),
        type: 'PAYABLE',
        description: 'Pagamento Fornecedor ABC',
        supplierName: 'Fornecedor ABC',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    expect(results.size).toBe(1);
    // Should have high confidence due to description + supplier name match
    expect(results.get('item-1')?.confidence).toBeGreaterThan(0.8);
  });

  it('should match with accent-insensitive description comparison', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 250.0,
        description: 'PAGAMENTO JOAO DA SILVA',
        transactionDate: new Date('2026-03-05'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 250.0,
        dueDate: new Date('2026-03-05'),
        type: 'PAYABLE',
        description: 'Pagamento João da Silva',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    expect(results.size).toBe(1);
  });

  it('should match within 1% amount tolerance when other criteria are strong', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 1000.0,
        description: 'Pagamento Fornecedor XYZ',
        transactionDate: new Date('2026-03-05'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 1005.0, // 0.5% difference
        dueDate: new Date('2026-03-05'),
        type: 'PAYABLE',
        description: 'Pagamento Fornecedor XYZ',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    // Amount within tolerance (30) + date exact (25) + description high (25) + type (10) = 90
    expect(results.size).toBe(1);
  });

  it('should not match when amount exceeds 1% tolerance', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 1000.0,
        transactionDate: new Date('2026-03-05'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 1020.0, // 2% difference — exceeds tolerance
        dueDate: new Date('2026-03-05'),
        type: 'PAYABLE',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    expect(results.size).toBe(0);
  });

  it('should apply minimum R$1.00 tolerance for small amounts', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 10.0,
        description: 'Pagamento Taxa Banco',
        transactionDate: new Date('2026-03-05'),
        type: 'DEBIT',
      }),
    ];

    const entries = [
      createTestEntry({
        id: 'entry-1',
        expectedAmount: 10.9, // R$0.90 difference, within R$1.00 tolerance
        dueDate: new Date('2026-03-05'),
        type: 'PAYABLE',
        description: 'Pagamento Taxa Banco',
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    // Amount within tolerance (30) + date exact (25) + description high (25) + type (10) = 90
    expect(results.size).toBe(1);
  });

  it('should match within 7-day window with lower score than 1-day window', () => {
    const itemClose = createTestItem({
      id: 'item-close',
      amount: 400.0,
      transactionDate: new Date('2026-03-06'), // 1 day diff
      type: 'DEBIT',
    });

    const itemFar = createTestItem({
      id: 'item-far',
      amount: 400.0,
      transactionDate: new Date('2026-03-11'), // 6 day diff
      type: 'DEBIT',
    });

    const entry = createTestEntry({
      id: 'entry-1',
      expectedAmount: 400.0,
      dueDate: new Date('2026-03-05'),
      type: 'PAYABLE',
    });

    const scoreClose = calculateMatchScore(itemClose, entry);
    const scoreFar = calculateMatchScore(itemFar, entry);

    // Closer date should produce higher score
    expect(scoreClose).toBeGreaterThan(scoreFar);
  });

  it('should prefer higher similarity descriptions when amounts match', () => {
    const item = createTestItem({
      id: 'item-1',
      amount: 300.0,
      description: 'PIX RECEBIDO MARIA OLIVEIRA ME',
      transactionDate: new Date('2026-03-05'),
      type: 'CREDIT',
    });

    const entryHighMatch = createTestEntry({
      id: 'entry-high',
      expectedAmount: 300.0,
      dueDate: new Date('2026-03-05'),
      type: 'RECEIVABLE',
      description: 'PIX Recebido Maria Oliveira ME',
    });

    const entryLowMatch = createTestEntry({
      id: 'entry-low',
      expectedAmount: 300.0,
      dueDate: new Date('2026-03-05'),
      type: 'RECEIVABLE',
      description: 'Aluguel escritório mensal',
    });

    const scoreHigh = calculateMatchScore(item, entryHighMatch);
    const scoreLow = calculateMatchScore(item, entryLowMatch);

    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });
});
