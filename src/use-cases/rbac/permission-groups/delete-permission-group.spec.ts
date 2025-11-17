import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePermissionGroupUseCase } from './delete-permission-group';

describe('DeletePermissionGroupUseCase', () => {
  let useCase: DeletePermissionGroupUseCase;
  let groupsRepository: InMemoryPermissionGroupsRepository;
  let userGroupsRepository: InMemoryUserPermissionGroupsRepository;

  beforeEach(() => {
    groupsRepository = new InMemoryPermissionGroupsRepository();
    userGroupsRepository = new InMemoryUserPermissionGroupsRepository();
    useCase = new DeletePermissionGroupUseCase(
      groupsRepository,
      userGroupsRepository,
    );
  });

  it('should delete permission group', async () => {
    const group = await groupsRepository.create({
      name: 'Test Group',
      slug: 'test-group',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    const result = await useCase.execute({ groupId: group.id.toString() });

    expect(result.success).toBe(true);

    const deleted = await groupsRepository.findById(group.id);
    expect(deleted).toBeNull(); // Soft deleted
  });

  it('should not delete non-existent group', async () => {
    await expect(
      useCase.execute({ groupId: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not delete system group', async () => {
    const group = await groupsRepository.create({
      name: 'System Group',
      slug: 'system-group',
      description: null,
      color: null,
      parentId: null,
      isSystem: true,
      isActive: true,
      priority: 0,
    });

    await expect(
      useCase.execute({ groupId: group.id.toString() }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      useCase.execute({ groupId: group.id.toString() }),
    ).rejects.toThrow('Cannot delete system permission groups');
  });

  it('should not delete group with children', async () => {
    const parent = await groupsRepository.create({
      name: 'Parent Group',
      slug: 'parent-group',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    await groupsRepository.create({
      name: 'Child Group',
      slug: 'child-group',
      description: null,
      color: null,
      parentId: parent.id,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    await expect(
      useCase.execute({ groupId: parent.id.toString() }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      useCase.execute({ groupId: parent.id.toString() }),
    ).rejects.toThrow('Cannot delete group with child groups');
  });

  it('should not delete group assigned to users without force flag', async () => {
    const group = await groupsRepository.create({
      name: 'Assigned Group',
      slug: 'assigned-group',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    // Assign group to user
    await userGroupsRepository.assign({
      userId: new UniqueEntityID('user-1'),
      groupId: group.id,
      expiresAt: null,
      grantedBy: null,
    });

    await expect(
      useCase.execute({ groupId: group.id.toString() }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      useCase.execute({ groupId: group.id.toString() }),
    ).rejects.toThrow('Cannot delete group assigned to 1 user(s)');
  });

  it('should delete group with force flag even if assigned to users', async () => {
    const group = await groupsRepository.create({
      name: 'Force Delete Group',
      slug: 'force-delete-group',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });

    // Assign group to 2 users
    await userGroupsRepository.assign({
      userId: new UniqueEntityID('user-1'),
      groupId: group.id,
      expiresAt: null,
      grantedBy: null,
    });

    await userGroupsRepository.assign({
      userId: new UniqueEntityID('user-2'),
      groupId: group.id,
      expiresAt: null,
      grantedBy: null,
    });

    const result = await useCase.execute({
      groupId: group.id.toString(),
      force: true,
    });

    expect(result.success).toBe(true);

    // Verify group is deleted
    const deleted = await groupsRepository.findById(group.id);
    expect(deleted).toBeNull();

    // Verify user assignments are removed
    const assignments = await userGroupsRepository.listByGroupId(group.id);
    expect(assignments).toHaveLength(0);
  });
});
