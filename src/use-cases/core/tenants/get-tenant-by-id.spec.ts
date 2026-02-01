import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantByIdUseCase } from './get-tenant-by-id';

let tenantsRepository: InMemoryTenantsRepository;
let sut: GetTenantByIdUseCase;

describe('GetTenantByIdUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    sut = new GetTenantByIdUseCase(tenantsRepository);
  });

  it('should return a tenant by id', async () => {
    const created = await tenantsRepository.create({
      name: 'Acme',
      slug: 'acme',
    });
    const { tenant } = await sut.execute({
      tenantId: created.tenantId.toString(),
    });
    expect(tenant.name).toBe('Acme');
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
