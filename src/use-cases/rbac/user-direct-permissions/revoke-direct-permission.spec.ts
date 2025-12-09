import { User } from '@/entities/core/user';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { InMemoryUserDirectPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-user-direct-permissions-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrantDirectPermissionUseCase } from './grant-direct-permission';
import { RevokeDirectPermissionUseCase } from './revoke-direct-permission';

describe('RevokeDirectPermissionUseCase', () => {
  let sut: RevokeDirectPermissionUseCase;
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

    sut = new RevokeDirectPermissionUseCase(
      usersRepository,
      permissionsRepository,
      userDirectPermissionsRepository,
    );
  });

  it('should revoke direct permission from user', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
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

    // First grant the permission
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    // Then revoke it
    await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    // Verify it was revoked
    const userPermissions = await userDirectPermissionsRepository.listByUserId(
      userId,
    );
    expect(userPermissions).toHaveLength(0);
  });

  it('should not revoke permission from NON-EXISTENT user', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(null);

    const permission = await permissionsRepository.create({
      code: 'test.permission.read',
      name: 'Test Permission',
      description: 'Test',
      module: 'test',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    await expect(
      sut.execute({
        userId: 'non-existent-id',
        permissionId: permission.id.toString(),
      }),
    ).rejects.toThrow('User not found');
  });

  it('should not revoke NON-EXISTENT permission', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    await expect(
      sut.execute({
        userId: userId.toString(),
        permissionId: 'non-existent-permission',
      }),
    ).rejects.toThrow('Permission not found');
  });

  it('should not revoke permission that is NOT ASSIGNED', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'not.assigned.read',
      name: 'Not Assigned',
      description: 'Permission not assigned to user',
      module: 'not',
      resource: 'assigned',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    await expect(
      sut.execute({
        userId: userId.toString(),
        permissionId: permission.id.toString(),
      }),
    ).rejects.toThrow('User does not have this permission assigned');
  });

  it('should revoke permission with DENY effect', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
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

    // Grant with deny effect
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      effect: 'deny',
    });

    // Revoke it
    await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    // Verify it was revoked
    const userPermissions = await userDirectPermissionsRepository.listByUserId(
      userId,
    );
    expect(userPermissions).toHaveLength(0);
  });

  it('should revoke EXPIRED permission', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
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

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    // Grant expired permission
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      expiresAt: pastDate,
    });

    // Revoke it
    await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    // Verify it was revoked
    const userPermissions = await userDirectPermissionsRepository.listByUserId(
      userId,
      { includeExpired: true },
    );
    expect(userPermissions).toHaveLength(0);
  });
});
