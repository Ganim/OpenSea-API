import { User } from '@/entities/core/user';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { InMemoryUserDirectPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-user-direct-permissions-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrantDirectPermissionUseCase } from './grant-direct-permission';
import { ListUsersByPermissionUseCase } from './list-users-by-permission';

describe('ListUsersByPermissionUseCase', () => {
  let sut: ListUsersByPermissionUseCase;
  let grantUseCase: GrantDirectPermissionUseCase;
  let usersRepository: InMemoryUsersRepository;
  let permissionsRepository: InMemoryPermissionsRepository;
  let userDirectPermissionsRepository: InMemoryUserDirectPermissionsRepository;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    permissionsRepository = new InMemoryPermissionsRepository();
    userDirectPermissionsRepository =
      new InMemoryUserDirectPermissionsRepository(permissionsRepository);

    grantUseCase = new GrantDirectPermissionUseCase(
      usersRepository,
      permissionsRepository,
      userDirectPermissionsRepository,
    );

    sut = new ListUsersByPermissionUseCase(
      permissionsRepository,
      userDirectPermissionsRepository,
    );
  });

  it('should list all users with a specific direct permission', async () => {
    const userId1 = new UniqueEntityID();
    const userId2 = new UniqueEntityID();
    const userId3 = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        id: userId1,
        username: Username.create('user1'),
        role: 'USER',
      } as unknown as User)
      .mockResolvedValueOnce({
        id: userId2,
        username: Username.create('user2'),
        role: 'USER',
      } as unknown as User)
      .mockResolvedValueOnce({
        id: userId3,
        username: Username.create('user3'),
        role: 'USER',
      } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'sales.orders.create',
      name: 'Create Sales Orders',
      description: 'Permission to create sales orders',
      module: 'sales',
      resource: 'orders',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    // Grant permission to user1 and user2, but not user3
    await grantUseCase.execute({
      userId: userId1.toString(),
      permissionId: permission.id.toString(),
    });

    await grantUseCase.execute({
      userId: userId2.toString(),
      permissionId: permission.id.toString(),
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
    });

    expect(result.userIds).toHaveLength(2);
    expect(result.userIds.map((id) => id.toString())).toEqual(
      expect.arrayContaining([userId1.toString(), userId2.toString()]),
    );
    expect(result.userIds.map((id) => id.toString())).not.toContain(
      userId3.toString(),
    );
  });

  it('should return EMPTY array when no users have the permission', async () => {
    const permission = await permissionsRepository.create({
      code: 'unused.permission.read',
      name: 'Unused Permission',
      description: 'Permission not assigned to anyone',
      module: 'unused',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
    });

    expect(result.userIds).toHaveLength(0);
  });

  it('should NOT include users with EXPIRED permissions', async () => {
    const userId1 = new UniqueEntityID();
    const userId2 = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        id: userId1,
        username: Username.create('user1'),
        role: 'USER',
      } as unknown as User)
      .mockResolvedValueOnce({
        id: userId2,
        username: Username.create('user2'),
        role: 'USER',
      } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'temp.access.read',
      name: 'Temporary Access',
      description: 'Temporary read access',
      module: 'temp',
      resource: 'access',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    // Grant active permission to user1
    await grantUseCase.execute({
      userId: userId1.toString(),
      permissionId: permission.id.toString(),
    });

    // Grant expired permission to user2
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await grantUseCase.execute({
      userId: userId2.toString(),
      permissionId: permission.id.toString(),
      expiresAt: pastDate,
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
    });

    expect(result.userIds).toHaveLength(1);
    expect(result.userIds[0].toString()).toBe(userId1.toString());
    expect(result.userIds.map((id) => id.toString())).not.toContain(
      userId2.toString(),
    );
  });

  it('should include users with both ALLOW and DENY effects', async () => {
    const userId1 = new UniqueEntityID();
    const userId2 = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        id: userId1,
        username: Username.create('user1'),
        role: 'USER',
      } as unknown as User)
      .mockResolvedValueOnce({
        id: userId2,
        username: Username.create('user2'),
        role: 'USER',
      } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'stock.products.delete',
      name: 'Delete Products',
      description: 'Permission to delete products',
      module: 'stock',
      resource: 'products',
      action: 'delete',
      isSystem: false,
      metadata: {},
    });

    // Grant with allow effect
    await grantUseCase.execute({
      userId: userId1.toString(),
      permissionId: permission.id.toString(),
      effect: 'allow',
    });

    // Grant with deny effect
    await grantUseCase.execute({
      userId: userId2.toString(),
      permissionId: permission.id.toString(),
      effect: 'deny',
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
    });

    expect(result.userIds).toHaveLength(2);
    expect(result.userIds.map((id) => id.toString())).toEqual(
      expect.arrayContaining([userId1.toString(), userId2.toString()]),
    );
  });

  it('should NOT return DUPLICATE user IDs', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'unique.test.read',
      name: 'Unique Test',
      description: 'Test for unique user IDs',
      module: 'unique',
      resource: 'test',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    // Grant permission
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
    });

    expect(result.userIds).toHaveLength(1);
    expect(result.userIds[0].toString()).toBe(userId.toString());
  });

  it('should not list users for NON-EXISTENT permission', async () => {
    await expect(
      sut.execute({
        permissionId: 'non-existent-id',
      }),
    ).rejects.toThrow('Permission not found');
  });

  it('should handle MULTIPLE users with same permission efficiently', async () => {
    const userIds = Array.from({ length: 5 }, () => new UniqueEntityID());

    // Mock all findById calls
    const spy = vi.spyOn(usersRepository, 'findById');
    userIds.forEach((userId, index) => {
      spy.mockResolvedValueOnce({
        id: userId,
        username: Username.create(`user${index}`),
        role: 'USER',
      } as unknown as User);
    });

    const permission = await permissionsRepository.create({
      code: 'common.feature.access',
      name: 'Common Feature',
      description: 'Commonly granted permission',
      module: 'common',
      resource: 'feature',
      action: 'access',
      isSystem: false,
      metadata: {},
    });

    // Grant permission to all users
    for (const userId of userIds) {
      await grantUseCase.execute({
        userId: userId.toString(),
        permissionId: permission.id.toString(),
      });
    }

    const result = await sut.execute({
      permissionId: permission.id.toString(),
    });

    expect(result.userIds).toHaveLength(5);
    expect(result.userIds.map((id) => id.toString())).toEqual(
      expect.arrayContaining(userIds.map((id) => id.toString())),
    );
  });
});
