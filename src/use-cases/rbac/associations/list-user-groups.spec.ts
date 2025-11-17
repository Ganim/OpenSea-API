import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Email } from '@/entities/core/value-objects/email';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListUserGroupsUseCase } from './list-user-groups';

describe('ListUserGroupsUseCase', () => {
  let useCase: ListUserGroupsUseCase;
  let userGroupsRepository: InMemoryUserPermissionGroupsRepository;
  let usersRepository: InMemoryUsersRepository;
  let groupsRepository: InMemoryPermissionGroupsRepository;
  let permissionGroupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let userId: UniqueEntityID;

  beforeEach(async () => {
    groupsRepository = new InMemoryPermissionGroupsRepository();
    usersRepository = new InMemoryUsersRepository();
    permissionGroupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    userGroupsRepository = new InMemoryUserPermissionGroupsRepository(
      groupsRepository,
      permissionGroupPermissionsRepository,
    );
    useCase = new ListUserGroupsUseCase(userGroupsRepository, usersRepository);

    // Create test user
    userId = new UniqueEntityID('user-1');
    // @ts-expect-error - Mock for testing
    usersRepository.items.push({
      id: userId,
      email: Email.create('test@example.com'),
    });
  });

  it('should list all user groups', async () => {
    const group1 = await groupsRepository.create({
      name: 'Admin',
      slug: 'admin',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    const group2 = await groupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    await userGroupsRepository.assign({
      userId,
      groupId: group1.id,
      expiresAt: null,
      grantedBy: null,
    });

    await userGroupsRepository.assign({
      userId,
      groupId: group2.id,
      expiresAt: null,
      grantedBy: null,
    });

    const result = await useCase.execute({ userId: userId.toString() });

    expect(result.groups).toHaveLength(2);
  });

  it('should exclude expired groups by default', async () => {
    const group1 = await groupsRepository.create({
      name: 'Active Group',
      slug: 'active',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    const group2 = await groupsRepository.create({
      name: 'Expired Group',
      slug: 'expired',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    await userGroupsRepository.assign({
      userId,
      groupId: group1.id,
      expiresAt: null,
      grantedBy: null,
    });

    await userGroupsRepository.assign({
      userId,
      groupId: group2.id,
      expiresAt: new Date(Date.now() - 1000), // Expired
      grantedBy: null,
    });

    const result = await useCase.execute({ userId: userId.toString() });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe('Active Group');
  });

  it('should include expired groups when requested', async () => {
    const group = await groupsRepository.create({
      name: 'Expired Group',
      slug: 'expired',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    await userGroupsRepository.assign({
      userId,
      groupId: group.id,
      expiresAt: new Date(Date.now() - 1000),
      grantedBy: null,
    });

    const result = await useCase.execute({
      userId: userId.toString(),
      includeExpired: true,
    });

    expect(result.groups).toHaveLength(1);
  });

  it('should exclude inactive groups by default', async () => {
    const group = await groupsRepository.create({
      name: 'Inactive Group',
      slug: 'inactive',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: false,
      priority: 0,
    });

    await userGroupsRepository.assign({
      userId,
      groupId: group.id,
      expiresAt: null,
      grantedBy: null,
    });

    const result = await useCase.execute({ userId: userId.toString() });

    expect(result.groups).toHaveLength(0);
  });

  it('should include inactive groups when requested', async () => {
    const group = await groupsRepository.create({
      name: 'Inactive Group',
      slug: 'inactive',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: false,
      priority: 0,
    });

    await userGroupsRepository.assign({
      userId,
      groupId: group.id,
      expiresAt: null,
      grantedBy: null,
    });

    const result = await useCase.execute({
      userId: userId.toString(),
      includeInactive: true,
    });

    expect(result.groups).toHaveLength(1);
  });

  it('should throw error when user not found', async () => {
    await expect(
      useCase.execute({ userId: 'non-existent-user' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
