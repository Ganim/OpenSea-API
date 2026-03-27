import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/finance/in-memory/in-memory-customer-portal-accesses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { InviteCustomerPortalUseCase } from './invite-customer-portal';

let repository: InMemoryCustomerPortalAccessesRepository;
let sut: InviteCustomerPortalUseCase;

describe('InviteCustomerPortalUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCustomerPortalAccessesRepository();
    sut = new InviteCustomerPortalUseCase(repository);
  });

  it('should create a customer portal access with a unique token', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
    });

    expect(result.access).toBeDefined();
    expect(result.access.customerId).toBe('customer-1');
    expect(result.access.customerName).toBe('Acme Corporation');
    expect(result.access.accessToken).toMatch(/^cpt_/);
    expect(result.access.isActive).toBe(true);
    expect(result.portalUrl).toContain('/customer-portal/');
    expect(repository.items).toHaveLength(1);
  });

  it('should set expiration when expiresInDays is provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      expiresInDays: 30,
    });

    expect(result.access.expiresAt).toBeDefined();
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 30);
    const diff = Math.abs(
      result.access.expiresAt!.getTime() - expectedDate.getTime(),
    );
    expect(diff).toBeLessThan(5000);
  });

  it('should reject duplicate active access for same customer in same tenant', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        customerName: 'Acme Corporation',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should allow same customer for different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
    });

    const result = await sut.execute({
      tenantId: 'tenant-2',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
    });

    expect(result.access).toBeDefined();
    expect(repository.items).toHaveLength(2);
  });

  it('should not have expiration when expiresInDays is omitted', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
    });

    expect(result.access.expiresAt).toBeNull();
  });
});
