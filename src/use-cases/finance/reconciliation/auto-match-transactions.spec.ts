import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import { FinanceEntry } from '@/entities/finance/finance-entry';
import { describe, expect, it } from 'vitest';
import { autoMatchTransactions } from './auto-match-transactions';

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
    expect(results.get('item-1')?.confidence).toBeGreaterThan(0.8);
  });

  it('should not match when amount differs', () => {
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
    expect(results.get('item-1')?.confidence).toBe(1.0); // Perfect score
  });

  it('should match within 3-day date window', () => {
    const items = [
      createTestItem({
        id: 'item-1',
        amount: 300.0,
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
      }),
    ];

    const results = autoMatchTransactions(items, entries);

    expect(results.size).toBe(1);
  });
});
