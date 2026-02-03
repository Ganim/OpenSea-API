import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionGroupSlugs } from '@/constants/rbac/permission-groups';
import { Email } from '@/entities/core/value-objects/email';
import { Password } from '@/entities/core/value-objects/password';
import { Url } from '@/entities/core/value-objects/url';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Tenant } from '@/entities/core/tenant';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTenantUserAdminUseCase } from './create-tenant-user-admin';

let tenantsRepository: InMemoryTenantsRepository;
let usersRepository: InMemoryUsersRepository;
let tenantUsersRepository: InMemoryTenantUsersRepository;
let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
let userPermissionGroupsRepository: InMemoryUserPermissionGroupsRepository;
let sut: CreateTenantUserAdminUseCase;
let tenant: Tenant;

describe('CreateTenantUserAdminUseCase', () => {
  beforeEach(async () => {
    tenantsRepository = new InMemoryTenantsRepository();
    usersRepository = new InMemoryUsersRepository();
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    userPermissionGroupsRepository =
      new InMemoryUserPermissionGroupsRepository();

    sut = new CreateTenantUserAdminUseCase(
      tenantsRepository,
      usersRepository,
      tenantUsersRepository,
      permissionGroupsRepository,
      userPermissionGroupsRepository,
    );

    // Create a test tenant
    tenant = await tenantsRepository.create({
      name: 'Test Tenant',
      slug: 'test-tenant',
    });

    // Create Admin and User groups for the tenant (as CreateTenantAdminUseCase would)
    await permissionGroupsRepository.create({
      name: 'Administrador',
      slug: PermissionGroupSlugs.ADMIN,
      description: null,
      isSystem: true,
      isActive: true,
      color: '#DC2626',
      priority: 100,
      parentId: null,
      tenantId: tenant.tenantId,
    });

    await permissionGroupsRepository.create({
      name: 'Usuario',
      slug: PermissionGroupSlugs.USER,
      description: null,
      isSystem: true,
      isActive: true,
      color: '#2563EB',
      priority: 10,
      parentId: null,
      tenantId: tenant.tenantId,
    });
  });

  it('should create a user and assign to tenant', async () => {
    const { user, tenantUser } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      email: 'newuser@test.com',
      password: 'Test@123',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('newuser@test.com');
    expect(tenantUser).toBeDefined();
    expect(tenantUser.tenantId).toBe(tenant.tenantId.toString());
    expect(tenantUser.userId).toBe(user.id);
    expect(tenantUser.role).toBe('member');
  });

  it('should create user with custom role', async () => {
    const { tenantUser } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      email: 'owner@test.com',
      password: 'Test@123',
      role: 'owner',
    });

    expect(tenantUser.role).toBe('owner');
  });

  it('should create user with custom username', async () => {
    const { user } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      email: 'custom@test.com',
      password: 'Test@123',
      username: 'customuser',
    });

    expect(user.username).toBe('customuser');
  });

  it('should auto-generate username when not provided', async () => {
    const { user } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      email: 'auto@test.com',
      password: 'Test@123',
    });

    expect(user.username).toBeDefined();
    expect(user.username.length).toBeGreaterThan(0);
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'non-existent-id',
        email: 'user@test.com',
        password: 'Test@123',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when email already in use', async () => {
    await usersRepository.create({
      email: Email.create('existing@test.com'),
      username: Username.create('existing'),
      passwordHash: await Password.create('Test@123'),
      profile: {
        name: '',
        surname: '',
        birthday: null,
        location: '',
        bio: '',
        avatarUrl: Url.empty(),
      },
    });

    await expect(() =>
      sut.execute({
        tenantId: tenant.tenantId.toString(),
        email: 'existing@test.com',
        password: 'Test@123',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when username already in use', async () => {
    await usersRepository.create({
      email: Email.create('taken@test.com'),
      username: Username.create('takenname'),
      passwordHash: await Password.create('Test@123'),
      profile: {
        name: '',
        surname: '',
        birthday: null,
        location: '',
        bio: '',
        avatarUrl: Url.empty(),
      },
    });

    await expect(() =>
      sut.execute({
        tenantId: tenant.tenantId.toString(),
        email: 'different@test.com',
        password: 'Test@123',
        username: 'takenname',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should assign owner to tenant Admin group', async () => {
    const { user } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      email: 'owner@test.com',
      password: 'Test@123',
      role: 'owner',
    });

    const assignment = userPermissionGroupsRepository.items.find(
      (upg) => upg.userId.toString() === user.id,
    );

    expect(assignment).toBeDefined();

    const group = permissionGroupsRepository.items.find((g) =>
      g.id.equals(assignment!.groupId),
    );

    expect(group).toBeDefined();
    expect(group!.slug).toBe(PermissionGroupSlugs.ADMIN);
    expect(group!.tenantId?.equals(tenant.tenantId)).toBe(true);
  });

  it('should assign member to tenant User group', async () => {
    const { user } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      email: 'member@test.com',
      password: 'Test@123',
      role: 'member',
    });

    const assignment = userPermissionGroupsRepository.items.find(
      (upg) => upg.userId.toString() === user.id,
    );

    expect(assignment).toBeDefined();

    const group = permissionGroupsRepository.items.find((g) =>
      g.id.equals(assignment!.groupId),
    );

    expect(group).toBeDefined();
    expect(group!.slug).toBe(PermissionGroupSlugs.USER);
    expect(group!.tenantId?.equals(tenant.tenantId)).toBe(true);
  });
});
