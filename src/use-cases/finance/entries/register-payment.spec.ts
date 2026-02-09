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
});
