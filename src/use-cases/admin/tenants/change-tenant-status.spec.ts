import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChangeTenantStatusUseCase } from './change-tenant-status';

let tenantsRepository: InMemoryTenantsRepository;
let sut: ChangeTenantStatusUseCase;

describe('ChangeTenantStatusUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    sut = new ChangeTenantStatusUseCase(tenantsRepository);
  });

  it('should change tenant status to SUSPENDED', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
      status: 'ACTIVE',
    });
    const { tenant: updated } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      status: 'SUSPENDED',
    });
    expect(updated.status).toBe('SUSPENDED');
  });

  it('should change tenant status to INACTIVE', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
      status: 'ACTIVE',
    });
    const { tenant: updated } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      status: 'INACTIVE',
    });
    expect(updated.status).toBe('INACTIVE');
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'non-existent', status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError for invalid status', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    await expect(() =>
      sut.execute({
        tenantId: tenant.tenantId.toString(),
        status: 'INVALID' as unknown as 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when tenant already has the same status', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
      status: 'ACTIVE',
    });
    await expect(() =>
      sut.execute({ tenantId: tenant.tenantId.toString(), status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
