import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTenantUsersUseCase } from './list-tenant-users';

let tenantsRepository: InMemoryTenantsRepository;
let tenantUsersRepository: InMemoryTenantUsersRepository;
let sut: ListTenantUsersUseCase;

describe('ListTenantUsersUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    sut = new ListTenantUsersUseCase(tenantsRepository, tenantUsersRepository);
  });

  // OBJECTIVE
  it('should list users of a tenant', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test Tenant',
      slug: 'test-tenant',
    });

    const userId1 = new UniqueEntityID();
    const userId2 = new UniqueEntityID();

    await tenantUsersRepository.create({
      tenantId: tenant.tenantId,
      userId: userId1,
      role: 'owner',
    });

    await tenantUsersRepository.create({
      tenantId: tenant.tenantId,
      userId: userId2,
      role: 'member',
    });

    const { tenantUsers } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
    });

    expect(tenantUsers).toHaveLength(2);
    expect(tenantUsers[0]).toEqual(
      expect.objectContaining({
        tenantId: tenant.tenantId.toString(),
        role: expect.any(String),
      }),
    );
  });

  it('should return empty array for tenant with no users', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Empty Tenant',
      slug: 'empty-tenant',
    });

    const { tenantUsers } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
    });

    expect(tenantUsers).toHaveLength(0);
  });

  // REJECTS
  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
