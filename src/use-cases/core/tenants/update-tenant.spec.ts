import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateTenantUseCase } from './update-tenant';

let tenantsRepository: InMemoryTenantsRepository;
let sut: UpdateTenantUseCase;

describe('UpdateTenantUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    sut = new UpdateTenantUseCase(tenantsRepository);
  });

  it('should update tenant name', async () => {
    const t = await tenantsRepository.create({ name: 'Old', slug: 'old' });
    const { tenant } = await sut.execute({
      tenantId: t.tenantId.toString(),
      name: 'New',
    });
    expect(tenant.name).toBe('New');
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'no', name: 'X' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when name is empty', async () => {
    const t = await tenantsRepository.create({ name: 'T', slug: 't' });
    await expect(() =>
      sut.execute({ tenantId: t.tenantId.toString(), name: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
