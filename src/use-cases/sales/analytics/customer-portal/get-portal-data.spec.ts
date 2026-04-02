import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/sales/in-memory/in-memory-customer-portal-accesses-repository';
import { CustomerPortalAccess } from '@/entities/sales/customer-portal-access';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPortalDataUseCase } from './get-portal-data';

let portalAccessesRepository: InMemoryCustomerPortalAccessesRepository;
let sut: GetPortalDataUseCase;

describe('GetPortalDataUseCase', () => {
  beforeEach(() => {
    portalAccessesRepository = new InMemoryCustomerPortalAccessesRepository();
    sut = new GetPortalDataUseCase(portalAccessesRepository);
  });

  it('should return portal data for a valid token', async () => {
    const access = CustomerPortalAccess.create({
      tenantId: new UniqueEntityID('tenant-1'),
      customerId: 'customer-1',
      accessToken: 'valid-token-123',
      isActive: true,
    });
    portalAccessesRepository.items.push(access);

    const result = await sut.execute({ accessToken: 'valid-token-123' });

    expect(result.access).toBeTruthy();
    expect(result.access.customerId).toBe('customer-1');
  });

  it('should throw if access token is empty', async () => {
    await expect(sut.execute({ accessToken: '' })).rejects.toThrow(
      'Access token is required.',
    );
  });

  it('should throw if token is not found', async () => {
    await expect(
      sut.execute({ accessToken: 'non-existent' }),
    ).rejects.toThrow();
  });

  it('should throw if access is revoked', async () => {
    const access = CustomerPortalAccess.create({
      tenantId: new UniqueEntityID('tenant-1'),
      customerId: 'customer-1',
      accessToken: 'revoked-token',
      isActive: false,
    });
    portalAccessesRepository.items.push(access);

    await expect(
      sut.execute({ accessToken: 'revoked-token' }),
    ).rejects.toThrow();
  });

  it('should throw if access is expired', async () => {
    const access = CustomerPortalAccess.create({
      tenantId: new UniqueEntityID('tenant-1'),
      customerId: 'customer-1',
      accessToken: 'expired-token',
      isActive: true,
      expiresAt: new Date('2020-01-01'),
    });
    portalAccessesRepository.items.push(access);

    await expect(sut.execute({ accessToken: 'expired-token' })).rejects.toThrow(
      'Portal access has expired.',
    );
  });

  it('should record access on successful retrieval', async () => {
    const access = CustomerPortalAccess.create({
      tenantId: new UniqueEntityID('tenant-1'),
      customerId: 'customer-1',
      accessToken: 'active-token',
      isActive: true,
    });
    portalAccessesRepository.items.push(access);

    await sut.execute({ accessToken: 'active-token' });

    expect(portalAccessesRepository.items[0].lastAccessAt).toBeTruthy();
  });
});
