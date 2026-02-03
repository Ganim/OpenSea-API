import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Email } from '@/entities/core/value-objects/email';
import { Password } from '@/entities/core/value-objects/password';
import { Url } from '@/entities/core/value-objects/url';
import { Username } from '@/entities/core/value-objects/username';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTenantUsersUseCase } from './list-tenant-users';

let tenantsRepository: InMemoryTenantsRepository;
let tenantUsersRepository: InMemoryTenantUsersRepository;
let usersRepository: InMemoryUsersRepository;
let sut: ListTenantUsersUseCase;

describe('ListTenantUsersUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new ListTenantUsersUseCase(
      tenantsRepository,
      tenantUsersRepository,
      usersRepository,
    );
  });

  // OBJECTIVE
  it('should list users of a tenant with user details', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test Tenant',
      slug: 'test-tenant',
    });

    const user1 = await usersRepository.create({
      email: Email.create('user1@test.com'),
      username: Username.create('user1'),
      passwordHash: await Password.create('Test@123'),
      profile: {
        name: 'User',
        surname: 'One',
        birthday: null,
        location: '',
        bio: '',
        avatarUrl: Url.empty(),
      },
    });

    const user2 = await usersRepository.create({
      email: Email.create('user2@test.com'),
      username: Username.create('user2'),
      passwordHash: await Password.create('Test@123'),
      profile: {
        name: 'User',
        surname: 'Two',
        birthday: null,
        location: '',
        bio: '',
        avatarUrl: Url.empty(),
      },
    });

    await tenantUsersRepository.create({
      tenantId: tenant.tenantId,
      userId: user1.id,
      role: 'owner',
    });

    await tenantUsersRepository.create({
      tenantId: tenant.tenantId,
      userId: user2.id,
      role: 'member',
    });

    const { users } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
    });

    expect(users).toHaveLength(2);
    expect(users[0]).toEqual(
      expect.objectContaining({
        tenantId: tenant.tenantId.toString(),
        role: expect.any(String),
        user: expect.objectContaining({
          email: expect.any(String),
          username: expect.any(String),
        }),
      }),
    );
  });

  it('should return empty array for tenant with no users', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Empty Tenant',
      slug: 'empty-tenant',
    });

    const { users } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
    });

    expect(users).toHaveLength(0);
  });

  // REJECTS
  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
