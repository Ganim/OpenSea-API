import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/sales/in-memory/in-memory-customer-portal-accesses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePortalAccessUseCase } from './create-portal-access';

let portalAccessesRepository: InMemoryCustomerPortalAccessesRepository;
let sut: CreatePortalAccessUseCase;

describe('CreatePortalAccessUseCase', () => {
  beforeEach(() => {
    portalAccessesRepository = new InMemoryCustomerPortalAccessesRepository();
    sut = new CreatePortalAccessUseCase(portalAccessesRepository);
  });

  it('should create a portal access for a customer', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
    });

    expect(result.access).toBeTruthy();
    expect(result.access.customerId).toBe('customer-1');
    expect(result.access.accessToken).toBeTruthy();
    expect(result.access.isActive).toBe(true);
    expect(portalAccessesRepository.items).toHaveLength(1);
  });

  it('should throw if customerId is missing', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        customerId: '',
      }),
    ).rejects.toThrow('Customer ID is required.');
  });

  it('should set custom permissions', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      permissions: { viewOrders: true, viewInvoices: false },
    });

    expect(result.access.permissions).toEqual({
      viewOrders: true,
      viewInvoices: false,
    });
  });

  it('should set expiration date when provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      expiresAt: '2027-01-01T00:00:00.000Z',
    });

    expect(result.access.expiresAt).toBeTruthy();
  });

  it('should throw for invalid expiration date', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        expiresAt: 'invalid-date',
      }),
    ).rejects.toThrow('Invalid expiration date format.');
  });

  it('should set contactId when provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      contactId: 'contact-1',
    });

    expect(result.access.contactId).toBe('contact-1');
  });
});
