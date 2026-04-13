import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SplitPaymentUseCase } from './split-payment';

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let sut: SplitPaymentUseCase;

// Fake transaction manager that executes synchronously (no real DB)
const fakeTransactionManager: import('@/lib/transaction-manager').TransactionManager =
  {
    run: async <T>(
      fn: (
        tx: import('@/lib/transaction-manager').TransactionClient,
      ) => Promise<T>,
    ): Promise<T> => {
      return fn(
        undefined as unknown as import('@/lib/transaction-manager').TransactionClient,
      );
    },
  };

describe('SplitPaymentUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    sut = new SplitPaymentUseCase(
      entriesRepository,
      paymentsRepository,
      fakeTransactionManager,
    );
  });

  it('should split payment across multiple entries and mark all as PAID', async () => {
    const entryA = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Fornecedor Alpha',
      categoryId: 'category-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const entryB = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Fornecedor Beta',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      paymentAmount: 5000,
      paymentDate: new Date('2026-02-15'),
      paymentMethod: 'PIX',
      allocations: [
        { entryId: entryA.id.toString(), amount: 3000 },
        { entryId: entryB.id.toString(), amount: 2000 },
      ],
    });

    expect(result.payments).toHaveLength(2);
    expect(result.fullyPaidEntryIds).toHaveLength(2);
    expect(result.partialEntryIds).toHaveLength(0);

    const updatedEntryA = entriesRepository.items.find((e) =>
      e.id.equals(entryA.id),
    );
    const updatedEntryB = entriesRepository.items.find((e) =>
      e.id.equals(entryB.id),
    );

    expect(updatedEntryA!.status).toBe('PAID');
    expect(updatedEntryB!.status).toBe('PAID');
    expect(updatedEntryA!.actualAmount).toBe(3000);
    expect(updatedEntryB!.actualAmount).toBe(2000);
  });

  it('should handle partial allocations correctly', async () => {
    const entryA = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta de luz',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const entryB = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta de agua',
      categoryId: 'category-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      paymentAmount: 5000,
      paymentDate: new Date('2026-02-15'),
      paymentMethod: 'BANK_TRANSFER',
      allocations: [
        { entryId: entryA.id.toString(), amount: 3000 },
        { entryId: entryB.id.toString(), amount: 2000 },
      ],
    });

    expect(result.fullyPaidEntryIds).toHaveLength(0);
    expect(result.partialEntryIds).toHaveLength(2);

    const updatedEntryA = entriesRepository.items.find((e) =>
      e.id.equals(entryA.id),
    );
    const updatedEntryB = entriesRepository.items.find((e) =>
      e.id.equals(entryB.id),
    );

    expect(updatedEntryA!.status).toBe('PARTIALLY_PAID');
    expect(updatedEntryB!.status).toBe('PARTIALLY_PAID');
    expect(updatedEntryA!.actualAmount).toBe(3000);
    expect(updatedEntryB!.actualAmount).toBe(2000);
  });

  it('should handle mixed full and partial allocations', async () => {
    const entryA = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const entryB = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Internet',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      paymentAmount: 4000,
      paymentDate: new Date('2026-02-15'),
      allocations: [
        { entryId: entryA.id.toString(), amount: 2000 },
        { entryId: entryB.id.toString(), amount: 2000 },
      ],
    });

    expect(result.fullyPaidEntryIds).toContain(entryA.id.toString());
    expect(result.partialEntryIds).toContain(entryB.id.toString());
  });

  it('should mark receivable entries as RECEIVED when fully paid', async () => {
    const receivableEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda de mercadoria',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      paymentAmount: 10000,
      paymentDate: new Date('2026-02-20'),
      allocations: [{ entryId: receivableEntry.id.toString(), amount: 10000 }],
    });

    expect(result.fullyPaidEntryIds).toContain(receivableEntry.id.toString());

    const updated = entriesRepository.items.find((e) =>
      e.id.equals(receivableEntry.id),
    );
    expect(updated!.status).toBe('RECEIVED');
  });

  it('should reject when allocations sum does not equal paymentAmount', async () => {
    const entryA = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta teste',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        paymentAmount: 5000,
        paymentDate: new Date('2026-02-15'),
        allocations: [{ entryId: entryA.id.toString(), amount: 3000 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when entry does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        paymentAmount: 1000,
        paymentDate: new Date('2026-02-15'),
        allocations: [{ entryId: 'non-existent-id', amount: 1000 }],
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject when entry is already PAID', async () => {
    const paidEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta ja paga',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    entriesRepository.items[0].status = 'PAID';

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        paymentAmount: 2000,
        paymentDate: new Date('2026-02-15'),
        allocations: [{ entryId: paidEntry.id.toString(), amount: 2000 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when entry is CANCELLED', async () => {
    const cancelledEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta cancelada',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    entriesRepository.items[0].status = 'CANCELLED';

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        paymentAmount: 2000,
        paymentDate: new Date('2026-02-15'),
        allocations: [{ entryId: cancelledEntry.id.toString(), amount: 2000 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when allocation exceeds remaining balance', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta parcial',
      categoryId: 'category-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        paymentAmount: 5000,
        paymentDate: new Date('2026-02-15'),
        allocations: [{ entryId: entry.id.toString(), amount: 5000 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when allocations are empty', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        paymentAmount: 1000,
        paymentDate: new Date('2026-02-15'),
        allocations: [],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when allocation amount is zero or negative', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta teste',
      categoryId: 'category-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        paymentAmount: 0,
        paymentDate: new Date('2026-02-15'),
        allocations: [{ entryId: entry.id.toString(), amount: 0 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should work with OVERDUE entries', async () => {
    const overdueEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta vencida',
      categoryId: 'category-1',
      expectedAmount: 4000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    entriesRepository.items[0].status = 'OVERDUE';

    const result = await sut.execute({
      tenantId: 'tenant-1',
      paymentAmount: 4000,
      paymentDate: new Date('2026-02-15'),
      allocations: [{ entryId: overdueEntry.id.toString(), amount: 4000 }],
    });

    expect(result.fullyPaidEntryIds).toContain(overdueEntry.id.toString());
  });

  it('should work with PARTIALLY_PAID entries', async () => {
    const partialEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta com parcial',
      categoryId: 'category-1',
      expectedAmount: 6000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    // Simulate existing partial payment
    entriesRepository.items[0].status = 'PARTIALLY_PAID';
    entriesRepository.items[0].actualAmount = 2000;
    await paymentsRepository.create({
      entryId: partialEntry.id.toString(),
      amount: 2000,
      paidAt: new Date('2026-02-10'),
    });

    // Pay remaining 4000
    const result = await sut.execute({
      tenantId: 'tenant-1',
      paymentAmount: 4000,
      paymentDate: new Date('2026-02-20'),
      allocations: [{ entryId: partialEntry.id.toString(), amount: 4000 }],
    });

    expect(result.fullyPaidEntryIds).toContain(partialEntry.id.toString());

    const updated = entriesRepository.items.find((e) =>
      e.id.equals(partialEntry.id),
    );
    expect(updated!.status).toBe('PAID');
    expect(updated!.actualAmount).toBe(6000);
  });
});
