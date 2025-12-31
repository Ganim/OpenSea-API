import { User } from '@/entities/core/user';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { InMemoryUserDirectPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-user-direct-permissions-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrantDirectPermissionUseCase } from './grant-direct-permission';

describe('GrantDirectPermissionUseCase', () => {
  let sut: GrantDirectPermissionUseCase;
  let usersRepository: InMemoryUsersRepository;
  let permissionsRepository: InMemoryPermissionsRepository;
  let userDirectPermissionsRepository: InMemoryUserDirectPermissionsRepository;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    permissionsRepository = new InMemoryPermissionsRepository();
    userDirectPermissionsRepository =
      new InMemoryUserDirectPermissionsRepository(permissionsRepository);

    sut = new GrantDirectPermissionUseCase(
      usersRepository,
      permissionsRepository,
      userDirectPermissionsRepository,
    );
  });

  it('should grant direct permission to user', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('sales.orders.create'),
      name: 'Create Sales Orders',
      description: 'Permission to create sales orders',
      module: 'sales',
      resource: 'orders',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    expect(result.directPermission).toBeDefined();
    expect(result.directPermission.userId.equals(userId)).toBe(true);
    expect(result.directPermission.permissionId.equals(permission.id)).toBe(
      true,
    );
    expect(result.directPermission.effect).toBe('allow');
  });

  it('should grant direct permission with DENY effect', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.delete'),
      name: 'Delete Products',
      description: 'Permission to delete products',
      module: 'stock',
      resource: 'products',
      action: 'delete',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      effect: 'deny',
    });

    expect(result.directPermission.effect).toBe('deny');
  });

  it('should grant direct permission with CONDITIONS', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('sales.orders.approve'),
      name: 'Approve Orders',
      description: 'Permission to approve orders',
      module: 'sales',
      resource: 'orders',
      action: 'approve',
      isSystem: false,
      metadata: {},
    });

    const conditions = { maxAmount: 1000, currency: 'BRL' };

    const result = await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      conditions,
    });

    expect(result.directPermission.conditions).toEqual(conditions);
  });

  it('should grant direct permission with EXPIRATION', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('temp.access.read'),
      name: 'Temporary Access',
      description: 'Temporary read access',
      module: 'temp',
      resource: 'access',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const result = await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      expiresAt,
    });

    expect(result.directPermission.expiresAt).toEqual(expiresAt);
  });

  it('should grant direct permission with GRANTED BY', async () => {
    const userId = new UniqueEntityID();
    const adminId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        id: userId,
        username: Username.create('john_doe'),
      } as unknown as User)
      .mockResolvedValueOnce({
        id: adminId,
        username: Username.create('admin'),
      } as unknown as User);

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('special.feature.access'),
      name: 'Special Feature',
      description: 'Access to special feature',
      module: 'special',
      resource: 'feature',
      action: 'access',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      grantedBy: adminId.toString(),
    });

    expect(result.directPermission.grantedBy?.equals(adminId)).toBe(true);
  });

  it('should not grant permission to NON-EXISTENT user', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(null);

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('test.permission.read'),
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

  it('should not grant NON-EXISTENT permission', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    await expect(
      sut.execute({
        userId: userId.toString(),
        permissionId: 'non-existent-permission',
      }),
    ).rejects.toThrow('Permission not found');
  });

  it('should not grant permission to BLOCKED user', async () => {
    const userId = new UniqueEntityID();

    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + 1);

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('blocked_user'),
      blockedUntil,
      isBlocked: true,
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('test.blocked.read'),
      name: 'Test Blocked',
      description: 'Test',
      module: 'test',
      resource: 'blocked',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    await expect(
      sut.execute({
        userId: userId.toString(),
        permissionId: permission.id.toString(),
      }),
    ).rejects.toThrow('Cannot grant permission to blocked user');
  });

  it('should not grant DUPLICATE permission', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('duplicate.test.read'),
      name: 'Duplicate Test',
      description: 'Test',
      module: 'duplicate',
      resource: 'test',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    // First grant
    await sut.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    // Try to grant again
    await expect(
      sut.execute({
        userId: userId.toString(),
        permissionId: permission.id.toString(),
      }),
    ).rejects.toThrow('User already has this permission assigned');
  });

  it('should not grant permission when GRANTER does not exist', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        id: userId,
        username: Username.create('john_doe'),
      } as unknown as User)
      .mockResolvedValueOnce(null); // Granter not found

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('granter.test.read'),
      name: 'Granter Test',
      description: 'Test',
      module: 'granter',
      resource: 'test',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    await expect(
      sut.execute({
        userId: userId.toString(),
        permissionId: permission.id.toString(),
        grantedBy: 'non-existent-granter',
      }),
    ).rejects.toThrow('Granter user not found');
  });
});
