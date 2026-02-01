import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListUserTenantsUseCase } from './list-user-tenants';

let tenantUsersRepository: InMemoryTenantUsersRepository;
let tenantsRepository: InMemoryTenantsRepository;
let sut: ListUserTenantsUseCase;

describe('ListUserTenantsUseCase', () => {
  beforeEach(() => {
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    tenantsRepository = new InMemoryTenantsRepository();
    sut = new ListUserTenantsUseCase(tenantUsersRepository, tenantsRepository);
  });

  it('should list tenants where user is a member', async () => {
    const userId = new UniqueEntityID();
    const t1 = await tenantsRepository.create({ name: 'A', slug: 'a' });
    const t2 = await tenantsRepository.create({ name: 'B', slug: 'b' });
    await tenantUsersRepository.create({
      tenantId: t1.tenantId,
      userId,
      role: 'owner',
    });
    await tenantUsersRepository.create({
      tenantId: t2.tenantId,
      userId,
      role: 'member',
    });
    const { tenants } = await sut.execute({ userId: userId.toString() });
    expect(tenants).toHaveLength(2);
  });

  it('should return empty list when user has no tenants', async () => {
    const { tenants } = await sut.execute({ userId: 'no-tenants' });
    expect(tenants).toHaveLength(0);
  });

  it('should only return active tenants', async () => {
    const userId = new UniqueEntityID();
    const active = await tenantsRepository.create({
      name: 'Active',
      slug: 'active',
      status: 'ACTIVE',
    });
    const inactive = await tenantsRepository.create({
      name: 'Inactive',
      slug: 'inactive',
      status: 'INACTIVE',
    });
    await tenantUsersRepository.create({ tenantId: active.tenantId, userId });
    await tenantUsersRepository.create({ tenantId: inactive.tenantId, userId });
    const { tenants } = await sut.execute({ userId: userId.toString() });
    expect(tenants).toHaveLength(1);
  });
});
