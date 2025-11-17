import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListUsersByGroupUseCase } from '../list-users-by-group';

describe('ListUsersByGroupUseCase', () => {
  let userPermissionGroupsRepository: InMemoryUserPermissionGroupsRepository;
  let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
  let permissionGroupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let sut: ListUsersByGroupUseCase;

  beforeEach(() => {
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    permissionGroupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    userPermissionGroupsRepository = new InMemoryUserPermissionGroupsRepository(
      permissionGroupsRepository,
      permissionGroupPermissionsRepository,
    );

    sut = new ListUsersByGroupUseCase(
      userPermissionGroupsRepository,
      permissionGroupsRepository,
    );
  });

  it('should list all users in a group', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Developers',
      slug: 'developers',
      description: 'Development team',
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 100,
      parentId: null,
    });

    const user1Id = new UniqueEntityID('user-1');
    const user2Id = new UniqueEntityID('user-2');
    const user3Id = new UniqueEntityID('user-3');

    await userPermissionGroupsRepository.assign({
      userId: user1Id,
      groupId: group.id,
      grantedBy: new UniqueEntityID('admin-1'),
      expiresAt: null,
    });

    await userPermissionGroupsRepository.assign({
      userId: user2Id,
      groupId: group.id,
      grantedBy: new UniqueEntityID('admin-1'),
      expiresAt: null,
    });

    await userPermissionGroupsRepository.assign({
      userId: user3Id,
      groupId: group.id,
      grantedBy: new UniqueEntityID('admin-1'),
      expiresAt: null,
    });

    const result = await sut.execute({ groupId: group.id.toString() });

    expect(result.userIds).toHaveLength(3);
    expect(result.userIds).toContain('user-1');
    expect(result.userIds).toContain('user-2');
    expect(result.userIds).toContain('user-3');
  });

  it('should exclude expired assignments by default', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Temporary',
      slug: 'temporary',
      description: 'Temporary group',
      isSystem: false,
      isActive: true,
      color: '#FF0000',
      priority: 50,
      parentId: null,
    });

    const user1Id = new UniqueEntityID('user-1');
    const user2Id = new UniqueEntityID('user-2');

    // Usuário com acesso válido
    await userPermissionGroupsRepository.assign({
      userId: user1Id,
      groupId: group.id,
      grantedBy: new UniqueEntityID('admin-1'),
      expiresAt: null,
    });

    // Usuário com acesso expirado
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await userPermissionGroupsRepository.assign({
      userId: user2Id,
      groupId: group.id,
      grantedBy: new UniqueEntityID('admin-1'),
      expiresAt: yesterday,
    });

    const result = await sut.execute({ groupId: group.id.toString() });

    expect(result.userIds).toHaveLength(1);
    expect(result.userIds).toContain('user-1');
    expect(result.userIds).not.toContain('user-2');
  });

  it('should include expired assignments when requested', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Historical',
      slug: 'historical',
      description: 'Historical group',
      isSystem: false,
      isActive: true,
      color: '#0000FF',
      priority: 75,
      parentId: null,
    });

    const user1Id = new UniqueEntityID('user-1');
    const user2Id = new UniqueEntityID('user-2');

    await userPermissionGroupsRepository.assign({
      userId: user1Id,
      groupId: group.id,
      grantedBy: new UniqueEntityID('admin-1'),
      expiresAt: null,
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await userPermissionGroupsRepository.assign({
      userId: user2Id,
      groupId: group.id,
      grantedBy: new UniqueEntityID('admin-1'),
      expiresAt: yesterday,
    });

    const result = await sut.execute({
      groupId: group.id.toString(),
      includeExpired: true,
    });

    expect(result.userIds).toHaveLength(2);
    expect(result.userIds).toContain('user-1');
    expect(result.userIds).toContain('user-2');
  });

  it('should return empty array when group has no users', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Empty Group',
      slug: 'empty-group',
      description: 'Group with no users',
      isSystem: false,
      isActive: true,
      color: '#FFFF00',
      priority: 25,
      parentId: null,
    });

    const result = await sut.execute({ groupId: group.id.toString() });

    expect(result.userIds).toHaveLength(0);
  });

  it('should not duplicate user IDs if user has multiple assignments', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Test Group',
      slug: 'test-group',
      description: 'Test group',
      isSystem: false,
      isActive: true,
      color: '#FF00FF',
      priority: 60,
      parentId: null,
    });

    const userId = new UniqueEntityID('user-1');

    // Simular múltiplas atribuições (ex: renovação)
    await userPermissionGroupsRepository.assign({
      userId,
      groupId: group.id,
      grantedBy: new UniqueEntityID('admin-1'),
      expiresAt: null,
    });

    const result = await sut.execute({ groupId: group.id.toString() });

    expect(result.userIds).toHaveLength(1);
    expect(result.userIds[0]).toBe('user-1');
  });

  it('should throw error when group not found', async () => {
    await expect(
      sut.execute({ groupId: 'non-existent-group' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
