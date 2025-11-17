import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePermissionGroupUseCase } from './update-permission-group';

describe('UpdatePermissionGroupUseCase', () => {
  let sut: UpdatePermissionGroupUseCase;
  let permissionGroupsRepository: InMemoryPermissionGroupsRepository;

  beforeEach(() => {
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    sut = new UpdatePermissionGroupUseCase(permissionGroupsRepository);
  });

  it('should update group name', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Admin',
      slug: 'admin',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#FF0000',
      priority: 100,
      parentId: null,
    });

    const result = await sut.execute({
      groupId: group.id.toString(),
      name: 'Super Admin',
    });

    expect(result.group.name).toBe('Super Admin');
    expect(result.group.slug).toBe('super-admin');
  });

  it('should update group color and priority', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: null,
    });

    const result = await sut.execute({
      groupId: group.id.toString(),
      color: '#0000FF',
      priority: 75,
    });

    expect(result.group.color).toBe('#0000FF');
    expect(result.group.priority).toBe(75);
    expect(result.group.name).toBe('Manager');
  });

  it('should update group parent', async () => {
    const parentGroup = await permissionGroupsRepository.create({
      name: 'Admin',
      slug: 'admin',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#FF0000',
      priority: 100,
      parentId: null,
    });

    const childGroup = await permissionGroupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: null,
    });

    const result = await sut.execute({
      groupId: childGroup.id.toString(),
      parentId: parentGroup.id.toString(),
    });

    expect(result.group.parentId?.equals(parentGroup.id)).toBe(true);
  });

  it('should remove parent when set to null', async () => {
    const parentGroup = await permissionGroupsRepository.create({
      name: 'Admin',
      slug: 'admin',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#FF0000',
      priority: 100,
      parentId: null,
    });

    const childGroup = await permissionGroupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: parentGroup.id,
    });

    const result = await sut.execute({
      groupId: childGroup.id.toString(),
      parentId: null,
    });

    expect(result.group.parentId).toBeNull();
  });

  it('should deactivate group', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Temporary',
      slug: 'temporary',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#CCCCCC',
      priority: 10,
      parentId: null,
    });

    const result = await sut.execute({
      groupId: group.id.toString(),
      isActive: false,
    });

    expect(result.group.isActive).toBe(false);
  });

  it('should not update with duplicate name', async () => {
    await permissionGroupsRepository.create({
      name: 'Admin',
      slug: 'admin',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#FF0000',
      priority: 100,
      parentId: null,
    });

    const managerGroup = await permissionGroupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: null,
    });

    await expect(
      sut.execute({
        groupId: managerGroup.id.toString(),
        name: 'Admin',
      }),
    ).rejects.toThrow('A group with this name already exists');
  });

  it('should not set group as its own parent', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Admin',
      slug: 'admin',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#FF0000',
      priority: 100,
      parentId: null,
    });

    await expect(
      sut.execute({
        groupId: group.id.toString(),
        parentId: group.id.toString(),
      }),
    ).rejects.toThrow('Group cannot be its own parent');
  });

  it('should not create circular reference', async () => {
    const grandparent = await permissionGroupsRepository.create({
      name: 'Grandparent',
      slug: 'grandparent',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#FF0000',
      priority: 100,
      parentId: null,
    });

    const parent = await permissionGroupsRepository.create({
      name: 'Parent',
      slug: 'parent',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 75,
      parentId: grandparent.id,
    });

    const child = await permissionGroupsRepository.create({
      name: 'Child',
      slug: 'child',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#0000FF',
      priority: 50,
      parentId: parent.id,
    });

    await expect(
      sut.execute({
        groupId: grandparent.id.toString(),
        parentId: child.id.toString(),
      }),
    ).rejects.toThrow('Cannot create circular reference in group hierarchy');
  });

  it('should not update non-existent group', async () => {
    await expect(
      sut.execute({
        groupId: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow('Permission group not found');
  });

  it('should not set non-existent parent', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: null,
    });

    await expect(
      sut.execute({
        groupId: group.id.toString(),
        parentId: 'non-existent-parent',
      }),
    ).rejects.toThrow('Parent group not found');
  });
});
