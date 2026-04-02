import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTenantFeatureFlagsRepository } from '@/repositories/core/in-memory/in-memory-tenant-feature-flags-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTenantFeatureFlagsUseCase } from './list-tenant-feature-flags';

let tenantsRepository: InMemoryTenantsRepository;
let tenantFeatureFlagsRepository: InMemoryTenantFeatureFlagsRepository;
let sut: ListTenantFeatureFlagsUseCase;

describe('ListTenantFeatureFlagsUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantFeatureFlagsRepository = new InMemoryTenantFeatureFlagsRepository();
    sut = new ListTenantFeatureFlagsUseCase(
      tenantsRepository,
      tenantFeatureFlagsRepository,
    );
  });

  it('should list feature flags for an existing tenant', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Tenant A',
      slug: 'tenant-a',
    });

    const tenantId = tenant.id;

    await tenantFeatureFlagsRepository.create({
      tenantId,
      flag: 'FEATURE_X',
      enabled: true,
    });

    await tenantFeatureFlagsRepository.create({
      tenantId,
      flag: 'FEATURE_Y',
      enabled: false,
    });

    const result = await sut.execute({ tenantId: tenantId.toString() });

    expect(result.featureFlags).toHaveLength(2);
    expect(result.featureFlags[0].flag).toBe('FEATURE_X');
    expect(result.featureFlags[0].enabled).toBe(true);
    expect(result.featureFlags[1].flag).toBe('FEATURE_Y');
    expect(result.featureFlags[1].enabled).toBe(false);
  });

  it('should return empty array when tenant has no feature flags', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Tenant B',
      slug: 'tenant-b',
    });

    const result = await sut.execute({ tenantId: tenant.id.toString() });

    expect(result.featureFlags).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError when tenant does not exist', async () => {
    await expect(
      sut.execute({ tenantId: new UniqueEntityID().toString() }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
