import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/finance/in-memory/in-memory-customer-portal-accesses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidatePortalTokenUseCase } from './validate-portal-token';

let repository: InMemoryCustomerPortalAccessesRepository;
let sut: ValidatePortalTokenUseCase;

describe('ValidatePortalTokenUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCustomerPortalAccessesRepository();
    sut = new ValidatePortalTokenUseCase(repository);
  });

  it('should validate a valid token', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const result = await sut.execute({ token: 'cpt_valid_token' });

    expect(result.access).toBeDefined();
    expect(result.access.customerId).toBe('customer-1');
    expect(result.access.lastAccessAt).toBeDefined();
  });

  it('should reject an invalid token', async () => {
    await expect(
      sut.execute({ token: 'cpt_invalid_token' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should reject an inactive token', async () => {
    const access = await repository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_inactive_token',
    });

    await repository.deactivate(access.id, 'tenant-1');

    await expect(
      sut.execute({ token: 'cpt_inactive_token' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should reject an expired token', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    await repository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_expired_token',
      expiresAt: pastDate,
    });

    await expect(
      sut.execute({ token: 'cpt_expired_token' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should take at least 300ms even on invalid token (brute-force timing mitigation)', async () => {
    const startedAt = Date.now();
    await expect(
      sut.execute({ token: 'cpt_nope' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    const elapsed = Date.now() - startedAt;
    expect(elapsed).toBeGreaterThanOrEqual(290);
  });
});
