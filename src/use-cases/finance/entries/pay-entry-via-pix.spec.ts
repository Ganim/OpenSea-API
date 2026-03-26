import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PayEntryViaPixUseCase } from './pay-entry-via-pix';

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let sut: PayEntryViaPixUseCase;

describe('PayEntryViaPixUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    sut = new PayEntryViaPixUseCase(entriesRepository, paymentsRepository);
  });

  it('should register a PIX payment for a PAYABLE PENDING entry', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Pagamento fornecedor',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      pixKey: '12345678901',
      pixKeyType: 'CPF',
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.payment.amount).toBe(500);
    expect(result.entry.status).toBe('PAID');
    expect(paymentsRepository.items).toHaveLength(1);
    expect(paymentsRepository.items[0].method).toBe('PIX');
  });

  it('should register a PIX payment for a PAYABLE OVERDUE entry', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Pagamento atrasado',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 300,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-02-01'),
      status: 'OVERDUE',
      pixKey: 'user@example.com',
      pixKeyType: 'EMAIL',
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.payment.amount).toBe(300);
    expect(result.entry.status).toBe('PAID');
  });

  it('should throw ResourceNotFoundError for non-existent entry', async () => {
    await expect(
      sut.execute({
        entryId: 'non-existent-id',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError(ResourceNotFoundError);
  });

  it('should throw BadRequestError for RECEIVABLE entry', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Conta a receber',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      pixKey: '12345678901',
    });

    await expect(
      sut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError(BadRequestError);
  });

  it('should throw BadRequestError for CANCELLED status', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Cancelado',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'CANCELLED',
      pixKey: '12345678901',
    });

    await expect(
      sut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError(BadRequestError);
  });

  it('should throw BadRequestError if entry has no PIX key', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Sem chave PIX',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    await expect(
      sut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError(BadRequestError);
  });
});
