import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterPaymentUseCase } from './register-payment';

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let sut: RegisterPaymentUseCase;

describe('RegisterPaymentUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    sut = new RegisterPaymentUseCase(entriesRepository, paymentsRepository);
  });

  it('should register a payment and mark as PAID', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel do escritorio',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 5000,
      paidAt: new Date('2026-02-15'),
      method: 'PIX',
    });

    expect(result.payment.amount).toBe(5000);
    expect(result.entry.status).toBe('PAID');
    expect(result.entry.actualAmount).toBe(5000);
  });

  it('should register partial payment and mark as PARTIALLY_PAID', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta parcelada',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 4000,
      paidAt: new Date('2026-02-10'),
      method: 'BANK_TRANSFER',
    });

    expect(result.payment.amount).toBe(4000);
    expect(result.entry.status).toBe('PARTIALLY_PAID');
    expect(result.entry.actualAmount).toBe(4000);
  });

  it('should not pay cancelled entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta cancelada',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'CANCELLED';

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        amount: 3000,
        paidAt: new Date('2026-02-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not pay already paid entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta ja paga',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'PAID';

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        amount: 2000,
        paidAt: new Date('2026-02-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not overpay (amount exceeds remaining balance)', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta com pagamento excedente',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        amount: 6000,
        paidAt: new Date('2026-02-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should register a receivable payment and mark as RECEIVED', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda de mercadoria',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 15000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 15000,
      paidAt: new Date('2026-02-20'),
      method: 'BANK_TRANSFER',
    });

    expect(result.payment.amount).toBe(15000);
    expect(result.entry.status).toBe('RECEIVED');
    expect(result.entry.actualAmount).toBe(15000);
  });

  // --- RECURRING TESTS ---

  it('should auto-generate next occurrence when paying recurring entry', async () => {
    // Create master entry
    const master = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel mensal',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-01'),
      recurrenceType: 'RECURRING',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
    });

    // Create first occurrence (child of master)
    const firstOccurrence = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Aluguel mensal (1)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'RECURRING',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      currentInstallment: 1,
      parentEntryId: master.id.toString(),
    });

    // Pay the first occurrence
    const result = await sut.execute({
      entryId: firstOccurrence.id.toString(),
      tenantId: 'tenant-1',
      amount: 5000,
      paidAt: new Date('2026-02-01'),
      method: 'PIX',
    });

    expect(result.entry.status).toBe('PAID');
    expect(result.nextOccurrence).toBeDefined();
    expect(result.nextOccurrence!.currentInstallment).toBe(2);
    expect(result.nextOccurrence!.description).toBe('Aluguel mensal (2)');
    expect(result.nextOccurrence!.parentEntryId).toBe(master.id.toString());

    // 3 entries total: master + occurrence 1 + occurrence 2
    expect(entriesRepository.items).toHaveLength(3);
  });

  it('should not generate next occurrence for partial recurring payment', async () => {
    const master = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-01'),
      recurrenceType: 'RECURRING',
    });

    const occurrence = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Aluguel (1)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'RECURRING',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      currentInstallment: 1,
      parentEntryId: master.id.toString(),
    });

    const result = await sut.execute({
      entryId: occurrence.id.toString(),
      tenantId: 'tenant-1',
      amount: 2000,
      paidAt: new Date('2026-02-01'),
      method: 'PIX',
    });

    expect(result.entry.status).toBe('PARTIALLY_PAID');
    expect(result.nextOccurrence).toBeUndefined();
    // Still only 2 entries
    expect(entriesRepository.items).toHaveLength(2);
  });

  // --- INSTALLMENT TESTS ---

  it('should mark master as PAID when all installments are paid', async () => {
    // Create master entry
    const master = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Financiamento',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'INSTALLMENT',
      totalInstallments: 3,
    });

    // Create 3 installments
    const installment1 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Financiamento (1/3)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'INSTALLMENT',
      currentInstallment: 1,
      parentEntryId: master.id.toString(),
    });

    const installment2 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Financiamento (2/3)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-03-01'),
      recurrenceType: 'INSTALLMENT',
      currentInstallment: 2,
      parentEntryId: master.id.toString(),
    });

    const installment3 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Financiamento (3/3)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-04-01'),
      recurrenceType: 'INSTALLMENT',
      currentInstallment: 3,
      parentEntryId: master.id.toString(),
    });

    // Pay installment 1
    await sut.execute({
      entryId: installment1.id.toString(),
      tenantId: 'tenant-1',
      amount: 1000,
      paidAt: new Date('2026-02-01'),
      method: 'PIX',
    });

    // Master should still be PENDING
    const masterAfterFirst = entriesRepository.items.find((i) =>
      i.id.equals(master.id),
    );
    expect(masterAfterFirst!.status).toBe('PENDING');

    // Pay installment 2
    await sut.execute({
      entryId: installment2.id.toString(),
      tenantId: 'tenant-1',
      amount: 1000,
      paidAt: new Date('2026-03-01'),
      method: 'PIX',
    });

    // Master should still be PENDING
    expect(masterAfterFirst!.status).toBe('PENDING');

    // Pay installment 3 (last one)
    await sut.execute({
      entryId: installment3.id.toString(),
      tenantId: 'tenant-1',
      amount: 1000,
      paidAt: new Date('2026-04-01'),
      method: 'PIX',
    });

    // Now master should be PAID
    const masterAfterAll = entriesRepository.items.find((i) =>
      i.id.equals(master.id),
    );
    expect(masterAfterAll!.status).toBe('PAID');
  });
});
