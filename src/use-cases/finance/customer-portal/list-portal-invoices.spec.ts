import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/finance/in-memory/in-memory-customer-portal-accesses-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPortalInvoicesUseCase } from './list-portal-invoices';

let portalRepository: InMemoryCustomerPortalAccessesRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: ListPortalInvoicesUseCase;

describe('ListPortalInvoicesUseCase', () => {
  beforeEach(() => {
    portalRepository = new InMemoryCustomerPortalAccessesRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new ListPortalInvoicesUseCase(portalRepository, entriesRepository);
  });

  it('should list receivable invoices for the customer', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    await entriesRepository.create({
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

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Despesa',
      categoryId: 'cat-1',
      expectedAmount: 500,
      issueDate: new Date(),
      dueDate: new Date(),
      supplierName: 'Supplier',
    });

    const result = await sut.execute({ token: 'cpt_valid_token' });

    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].type).toBe('RECEIVABLE');
    expect(result.customerName).toBe('Acme Corporation');
  });

  it('should reject an invalid token', async () => {
    await expect(
      sut.execute({ token: 'cpt_invalid_token' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should reject an inactive access', async () => {
    const access = await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_inactive_token',
    });

    await portalRepository.deactivate(access.id, 'tenant-1');

    await expect(
      sut.execute({ token: 'cpt_inactive_token' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
