import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPermissionGroupByIdUseCase } from './get-permission-group-by-id';

describe('GetPermissionGroupByIdUseCase', () => {
  let useCase: GetPermissionGroupByIdUseCase;
  let groupsRepository: InMemoryPermissionGroupsRepository;
  let userGroupsRepository: InMemoryUserPermissionGroupsRepository;
  let groupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let usersRepository: InMemoryUsersRepository;

  beforeEach(() => {
    groupsRepository = new InMemoryPermissionGroupsRepository();
    userGroupsRepository = new InMemoryUserPermissionGroupsRepository();
    groupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    usersRepository = new InMemoryUsersRepository();
    useCase = new GetPermissionGroupByIdUseCase(
      groupsRepository,
      userGroupsRepository,
      groupPermissionsRepository,
      usersRepository,
    );
  });

  it('should get permission group by id with users and permissions', async () => {
    const group = await groupsRepository.create({
      name: 'Admin Group',
      slug: 'admin-group',
      description: 'Admin permissions',
      color: '#FF0000',
      parentId: null,
      priority: 100,
      isSystem: false,
      isActive: true,
    });

    const result = await useCase.execute({ id: group.id.toString() });

    expect(result.group).toBe(group);
    expect(result.group.name).toBe('Admin Group');
    expect(result.group.slug).toBe('admin-group');
    expect(result.users).toBeDefined();
    expect(result.permissions).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
    expect(Array.isArray(result.permissions)).toBe(true);
  });

  it('should get system group', async () => {
    const group = await groupsRepository.create({
      name: 'System Group',
      slug: 'system-group',
      description: null,
      color: null,
      parentId: null,
      priority: 100,
      isSystem: true,
      isActive: true,
    });

    const result = await useCase.execute({ id: group.id.toString() });

    expect(result.group.isSystem).toBe(true);
    expect(result.users).toBeDefined();
    expect(result.permissions).toBeDefined();
  });

  it('should get group with parent', async () => {
    const parentGroup = await groupsRepository.create({
      name: 'Parent Group',
      slug: 'parent-group',
      description: null,
      color: null,
      parentId: null,
      priority: 100,
      isSystem: false,
      isActive: true,
    });

    const childGroup = await groupsRepository.create({
      name: 'Child Group',
      slug: 'child-group',
      description: null,
      color: null,
      parentId: parentGroup.id,
      priority: 50,
      isSystem: false,
      isActive: true,
    });

    const result = await useCase.execute({ id: childGroup.id.toString() });

    expect(result.group.parentId).toBeDefined();
    expect(result.group.parentId?.equals(parentGroup.id)).toBe(true);
    expect(result.users).toBeDefined();
    expect(result.permissions).toBeDefined();
  });

  it('should throw error when group not found', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
