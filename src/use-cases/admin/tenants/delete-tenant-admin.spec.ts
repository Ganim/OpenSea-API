import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteTenantAdminUseCase } from './delete-tenant-admin';

let tenantsRepository: InMemoryTenantsRepository;
let sut: DeleteTenantAdminUseCase;

describe('DeleteTenantAdminUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    sut = new DeleteTenantAdminUseCase(tenantsRepository);
  });

  it('should deactivate a tenant', async () => {
    const created = await tenantsRepository.create({
      name: 'Active Company',
      slug: 'active',
      status: 'ACTIVE',
    });

    const { tenant } = await sut.execute({
      tenantId: created.tenantId.toString(),
    });

    expect(tenant.status).toBe('INACTIVE');
    expect(tenant.name).toBe('Active Company');
  });

  it('should deactivate a suspended tenant', async () => {
    const created = await tenantsRepository.create({
      name: 'Suspended',
      slug: 'suspended',
      status: 'SUSPENDED',
    });

    const { tenant } = await sut.execute({
      tenantId: created.tenantId.toString(),
    });

    expect(tenant.status).toBe('INACTIVE');
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
