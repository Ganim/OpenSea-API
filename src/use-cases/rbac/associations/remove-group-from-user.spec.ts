import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Email } from '@/entities/core/value-objects/email';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PermissionGroup } from '@/entities/rbac/permission-group';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveGroupFromUserUseCase } from './remove-group-from-user';

describe('RemoveGroupFromUserUseCase', () => {
  let useCase: RemoveGroupFromUserUseCase;
  let userGroupsRepository: InMemoryUserPermissionGroupsRepository;
  let usersRepository: InMemoryUsersRepository;
  let groupsRepository: InMemoryPermissionGroupsRepository;
  let testGroup: PermissionGroup;

  beforeEach(async () => {
    userGroupsRepository = new InMemoryUserPermissionGroupsRepository();
    usersRepository = new InMemoryUsersRepository();
    groupsRepository = new InMemoryPermissionGroupsRepository();
    useCase = new RemoveGroupFromUserUseCase(
      userGroupsRepository,
      usersRepository,
      groupsRepository,
    );

    // Create test group
    testGroup = await groupsRepository.create({
      name: 'Test Group',
      slug: 'test-group',
      description: null,
      color: null,
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 0,
    });
  });

  it('should remove group from user', async () => {
    const userId = new UniqueEntityID('user-1');

    // Mock user in repository
    // @ts-expect-error - Accessing private property for testing
    usersRepository.items.push({
      id: userId,
      email: Email.create('test@example.com'),
    });

    // Assign group
    await userGroupsRepository.assign({
      userId,
      groupId: testGroup.id,
      expiresAt: null,
      grantedBy: null,
    });

    const result = await useCase.execute({
      userId: userId.toString(),
      groupId: testGroup.id.toString(),
    });

    expect(result.success).toBe(true);

    const exists = await userGroupsRepository.exists(userId, testGroup.id);
    expect(exists).toBe(false);
  });

  it('should succeed even if group was not assigned', async () => {
    const userId = new UniqueEntityID('user-2');

    // Mock user in repository
    // @ts-expect-error - Accessing private property for testing
    usersRepository.items.push({
      id: userId,
      email: Email.create('test2@example.com'),
    });

    const result = await useCase.execute({
      userId: userId.toString(),
      groupId: testGroup.id.toString(),
    });

    expect(result.success).toBe(true);
  });

  it('should throw error when user not found', async () => {
    await expect(
      useCase.execute({
        userId: 'non-existent-user',
        groupId: testGroup.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error when group not found', async () => {
    const userId = new UniqueEntityID('user-3');

    // Mock user in repository
    // @ts-expect-error - Accessing private property for testing
    usersRepository.items.push({
      id: userId,
      email: Email.create('test3@example.com'),
    });

    await expect(
      useCase.execute({
        userId: userId.toString(),
        groupId: 'non-existent-group',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
