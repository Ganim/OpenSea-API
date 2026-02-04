import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTenantPlansRepository } from '@/repositories/core/in-memory/in-memory-tenant-plans-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantDetailsUseCase } from './get-tenant-details';

let tenantsRepository: InMemoryTenantsRepository;
let tenantPlansRepository: InMemoryTenantPlansRepository;
let sut: GetTenantDetailsUseCase;

describe('GetTenantDetailsUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantPlansRepository = new InMemoryTenantPlansRepository();
    sut = new GetTenantDetailsUseCase(tenantsRepository, tenantPlansRepository);
  });

  it('should get tenant details by id', async () => {
    const createdTenant = await tenantsRepository.create({
      name: 'Acme Corp',
      slug: 'acme-corp',
    });
    const { tenant, currentPlanId } = await sut.execute({
      tenantId: createdTenant.tenantId.toString(),
    });
    expect(tenant).toBeDefined();
    expect(tenant.name).toBe('Acme Corp');
    expect(currentPlanId).toBeNull();
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
