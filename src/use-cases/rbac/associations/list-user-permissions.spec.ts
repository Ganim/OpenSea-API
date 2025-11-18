import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { User } from '@/entities/core/user';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListUserPermissionsUseCase } from './list-user-permissions';

describe('ListUserPermissionsUseCase', () => {
  let sut: ListUserPermissionsUseCase;
  let usersRepository: InMemoryUsersRepository;
  let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
  let permissionGroupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let userPermissionGroupsRepository: InMemoryUserPermissionGroupsRepository;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    permissionGroupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    userPermissionGroupsRepository = new InMemoryUserPermissionGroupsRepository(
      permissionGroupsRepository,
      permissionGroupPermissionsRepository,
    );
    sut = new ListUserPermissionsUseCase(
      userPermissionGroupsRepository,
      usersRepository,
    );
  });

  it('should return empty array when user has no groups', async () => {
    const user = { id: new UniqueEntityID('user-1') } as User;
    // @ts-expect-error - Accessing private property for testing
    usersRepository.items.push(user);
    const result = await sut.execute({ userId: 'user-1' });
    expect(result.permissions).toHaveLength(0);
  });

  it('should throw error when user not found', async () => {
    await expect(sut.execute({ userId: 'non-existent' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
