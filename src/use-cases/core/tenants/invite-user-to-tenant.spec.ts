import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Email } from '@/entities/core/value-objects/email';
import { Username } from '@/entities/core/value-objects/username';
import { InMemoryTenantPlansRepository } from '@/repositories/core/in-memory/in-memory-tenant-plans-repository';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { InviteUserToTenantUseCase } from './invite-user-to-tenant';

let tenantsRepository: InMemoryTenantsRepository;
let tenantUsersRepository: InMemoryTenantUsersRepository;
let usersRepository: InMemoryUsersRepository;
let tenantPlansRepository: InMemoryTenantPlansRepository;
let sut: InviteUserToTenantUseCase;

describe('InviteUserToTenantUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    usersRepository = new InMemoryUsersRepository();
    tenantPlansRepository = new InMemoryTenantPlansRepository();
    sut = new InviteUserToTenantUseCase(
      tenantsRepository,
      tenantUsersRepository,
      usersRepository,
      tenantPlansRepository,
    );
  });

  it('should invite a user to a tenant', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    const user = await usersRepository.create({
      email: Email.create('user@test.com'),
      username: Username.create('testuser'),
      passwordHash: 'hashed',
      profile: { name: 'Test', surname: 'User' },
    });
    const { tenantUser } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      userId: user.id.toString(),
    });
    expect(tenantUser).toBeDefined();
    expect(tenantUser.role).toBe('member');
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    const user = await usersRepository.create({
      email: Email.create('u@t.com'),
      username: Username.create('testuser2'),
      passwordHash: 'h',
      profile: { name: 'T', surname: 'U' },
    });
    await expect(() =>
      sut.execute({ tenantId: 'non-existent', userId: user.id.toString() }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError for non-existent user', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    await expect(() =>
      sut.execute({
        tenantId: tenant.tenantId.toString(),
        userId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when user is already a member', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    const user = await usersRepository.create({
      email: Email.create('u2@t.com'),
      username: Username.create('testuser3'),
      passwordHash: 'h',
      profile: { name: 'T', surname: 'U' },
    });
    await sut.execute({
      tenantId: tenant.tenantId.toString(),
      userId: user.id.toString(),
    });
    await expect(() =>
      sut.execute({
        tenantId: tenant.tenantId.toString(),
        userId: user.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
