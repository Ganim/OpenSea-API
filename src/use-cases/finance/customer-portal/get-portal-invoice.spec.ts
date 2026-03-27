import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/finance/in-memory/in-memory-customer-portal-accesses-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPortalInvoiceUseCase } from './get-portal-invoice';

let portalRepository: InMemoryCustomerPortalAccessesRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: GetPortalInvoiceUseCase;

describe('GetPortalInvoiceUseCase', () => {
  beforeEach(() => {
    portalRepository = new InMemoryCustomerPortalAccessesRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GetPortalInvoiceUseCase(portalRepository, entriesRepository);
  });

  it('should return a specific invoice for the customer', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Fatura Janeiro',
      categoryId: 'cat-1',
      expectedAmount: 1500,
      issueDate: new Date(),
      dueDate: new Date(),
      customerName: 'Acme Corporation',
    });

    const result = await sut.execute({
      token: 'cpt_valid_token',
      invoiceId: entry.id.toString(),
    });

    expect(result.invoice).toBeDefined();
    expect(result.invoice.id.toString()).toBe(entry.id.toString());
  });

  it('should reject an invalid token', async () => {
    await expect(
      sut.execute({ token: 'cpt_invalid_token', invoiceId: 'any-id' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should reject access to non-existent invoice', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    await expect(
      sut.execute({
        token: 'cpt_valid_token',
        invoiceId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject access to PAYABLE entries', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Despesa',
      categoryId: 'cat-1',
      expectedAmount: 500,
      issueDate: new Date(),
      dueDate: new Date(),
    });

    await expect(
      sut.execute({
        token: 'cpt_valid_token',
        invoiceId: entry.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject access to another customer invoice', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Fatura outro cliente',
      categoryId: 'cat-1',
      expectedAmount: 2000,
      issueDate: new Date(),
      dueDate: new Date(),
      customerName: 'Other Company',
    });

    await expect(
      sut.execute({
        token: 'cpt_valid_token',
        invoiceId: entry.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
