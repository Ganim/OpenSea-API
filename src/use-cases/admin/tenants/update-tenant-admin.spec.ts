import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateTenantAdminUseCase } from './update-tenant-admin';

let tenantsRepository: InMemoryTenantsRepository;
let sut: UpdateTenantAdminUseCase;

describe('UpdateTenantAdminUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    sut = new UpdateTenantAdminUseCase(tenantsRepository);
  });

  it('should update a tenant name', async () => {
    const created = await tenantsRepository.create({
      name: 'Old Name',
      slug: 'old-name',
    });
    const { tenant } = await sut.execute({
      tenantId: created.tenantId.toString(),
      name: 'New Name',
    });
    expect(tenant.name).toBe('New Name');
  });

  it('should update a tenant slug', async () => {
    const created = await tenantsRepository.create({
      name: 'Company',
      slug: 'company',
    });
    const { tenant } = await sut.execute({
      tenantId: created.tenantId.toString(),
      slug: 'new-slug',
    });
    expect(tenant.slug).toBe('new-slug');
  });

  it('should allow updating to the same slug', async () => {
    const created = await tenantsRepository.create({
      name: 'Company',
      slug: 'company',
    });
    const { tenant } = await sut.execute({
      tenantId: created.tenantId.toString(),
      slug: 'company',
    });
    expect(tenant.slug).toBe('company');
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'non-existent-id', name: 'Updated' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when name is empty', async () => {
    const created = await tenantsRepository.create({
      name: 'Company',
      slug: 'company',
    });
    await expect(() =>
      sut.execute({ tenantId: created.tenantId.toString(), name: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when slug already exists', async () => {
    await tenantsRepository.create({ name: 'A', slug: 'slug-a' });
    const b = await tenantsRepository.create({ name: 'B', slug: 'slug-b' });
    await expect(() =>
      sut.execute({ tenantId: b.tenantId.toString(), slug: 'slug-a' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
