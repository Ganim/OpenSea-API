import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTenantFeatureFlagsRepository } from '@/repositories/core/in-memory/in-memory-tenant-feature-flags-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ManageTenantFeatureFlagsUseCase } from './manage-tenant-feature-flags';

let tenantsRepository: InMemoryTenantsRepository;
let tenantFeatureFlagsRepository: InMemoryTenantFeatureFlagsRepository;
let sut: ManageTenantFeatureFlagsUseCase;

describe('ManageTenantFeatureFlagsUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantFeatureFlagsRepository = new InMemoryTenantFeatureFlagsRepository();
    sut = new ManageTenantFeatureFlagsUseCase(
      tenantsRepository,
      tenantFeatureFlagsRepository,
    );
  });

  it('should create a new feature flag for a tenant', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    const { featureFlag } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      flag: 'dark-mode',
      enabled: true,
    });
    expect(featureFlag).toBeDefined();
    expect(featureFlag.flag).toBe('dark-mode');
    expect(featureFlag.enabled).toBe(true);
  });

  it('should update an existing feature flag', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    await sut.execute({
      tenantId: tenant.tenantId.toString(),
      flag: 'beta',
      enabled: false,
    });
    const { featureFlag } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      flag: 'beta',
      enabled: true,
    });
    expect(featureFlag.enabled).toBe(true);
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'non-existent', flag: 'test', enabled: true }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when flag name is empty', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    await expect(() =>
      sut.execute({
        tenantId: tenant.tenantId.toString(),
        flag: '',
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
