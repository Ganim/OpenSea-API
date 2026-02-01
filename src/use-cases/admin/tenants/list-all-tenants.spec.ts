import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAllTenantsUseCase } from './list-all-tenants';

let tenantsRepository: InMemoryTenantsRepository;
let sut: ListAllTenantsUseCase;

describe('ListAllTenantsUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    sut = new ListAllTenantsUseCase(tenantsRepository);
  });

  it('should list all tenants with pagination', async () => {
    await tenantsRepository.create({ name: 'Tenant A', slug: 'tenant-a' });
    await tenantsRepository.create({ name: 'Tenant B', slug: 'tenant-b' });
    await tenantsRepository.create({ name: 'Tenant C', slug: 'tenant-c' });

    const { tenants, meta } = await sut.execute({ page: 1, perPage: 2 });

    expect(tenants).toHaveLength(2);
    expect(meta.total).toBe(3);
    expect(meta.page).toBe(1);
    expect(meta.perPage).toBe(2);
    expect(meta.totalPages).toBe(2);
  });

  it('should return empty list when no tenants exist', async () => {
    const { tenants, meta } = await sut.execute({ page: 1, perPage: 20 });
    expect(tenants).toHaveLength(0);
    expect(meta.total).toBe(0);
  });
});
