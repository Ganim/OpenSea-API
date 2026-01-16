import { User } from '@/entities/core/user';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { InMemoryUserDirectPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-user-direct-permissions-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrantDirectPermissionUseCase } from './grant-direct-permission';
import { ListUserDirectPermissionsUseCase } from './list-user-direct-permissions';

describe('ListUserDirectPermissionsUseCase', () => {
  let sut: ListUserDirectPermissionsUseCase;
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

    sut = new ListUserDirectPermissionsUseCase(
      usersRepository,
      permissionsRepository,
      userDirectPermissionsRepository,
    );
  });

  it('should list all direct permissions of a user', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission1 = await permissionsRepository.create({
      code: PermissionCode.create('sales.orders.create'),
      name: 'Create Sales Orders',
      description: 'Permission to create sales orders',
      module: 'sales',
      resource: 'orders',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    const permission2 = await permissionsRepository.create({
      code: PermissionCode.create('sales.orders.read'),
      name: 'Read Sales Orders',
      description: 'Permission to read sales orders',
      module: 'sales',
      resource: 'orders',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    // Grant both permissions
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission1.id.toString(),
    });

    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission2.id.toString(),
    });

    const result = await sut.execute({
      userId: userId.toString(),
    });

    expect(result.permissions).toHaveLength(2);
    expect(result.permissions.map((p) => p.permission.code.value)).toEqual(
      expect.arrayContaining(['sales.orders.create', 'sales.orders.read']),
    );
  });

  it('should return EMPTY array when user has no direct permissions', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const result = await sut.execute({
      userId: userId.toString(),
    });

    expect(result.permissions).toHaveLength(0);
  });

  it('should NOT include EXPIRED permissions by default', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission1 = await permissionsRepository.create({
      code: PermissionCode.create('active.permission.read'),
      name: 'Active Permission',
      description: 'Active permission',
      module: 'active',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const permission2 = await permissionsRepository.create({
      code: PermissionCode.create('expired.permission.read'),
      name: 'Expired Permission',
      description: 'Expired permission',
      module: 'expired',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    // Grant active permission
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission1.id.toString(),
    });

    // Grant expired permission
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission2.id.toString(),
      expiresAt: pastDate,
    });

    const result = await sut.execute({
      userId: userId.toString(),
    });

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].permission.code.value).toBe(
      'active.permission.read',
    );
  });

  it('should INCLUDE expired permissions when requested', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission1 = await permissionsRepository.create({
      code: PermissionCode.create('active.permission.read'),
      name: 'Active Permission',
      description: 'Active permission',
      module: 'active',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const permission2 = await permissionsRepository.create({
      code: PermissionCode.create('expired.permission.read'),
      name: 'Expired Permission',
      description: 'Expired permission',
      module: 'expired',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    // Grant active permission
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission1.id.toString(),
    });

    // Grant expired permission
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission2.id.toString(),
      expiresAt: pastDate,
    });

    const result = await sut.execute({
      userId: userId.toString(),
      includeExpired: true,
    });

    expect(result.permissions).toHaveLength(2);
  });

  it('should filter by ALLOW effect', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission1 = await permissionsRepository.create({
      code: PermissionCode.create('allow.permission.read'),
      name: 'Allow Permission',
      description: 'Permission with allow effect',
      module: 'allow',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const permission2 = await permissionsRepository.create({
      code: PermissionCode.create('deny.permission.read'),
      name: 'Deny Permission',
      description: 'Permission with deny effect',
      module: 'deny',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    // Grant with allow effect
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission1.id.toString(),
      effect: 'allow',
    });

    // Grant with deny effect
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission2.id.toString(),
      effect: 'deny',
    });

    const result = await sut.execute({
      userId: userId.toString(),
      effect: 'allow',
    });

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].permission.code.value).toBe(
      'allow.permission.read',
    );
    expect(result.permissions[0].effect).toBe('allow');
  });

  it('should filter by DENY effect', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
    } as unknown as User);

    const permission1 = await permissionsRepository.create({
      code: PermissionCode.create('allow.permission.read'),
      name: 'Allow Permission',
      description: 'Permission with allow effect',
      module: 'allow',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const permission2 = await permissionsRepository.create({
      code: PermissionCode.create('deny.permission.read'),
      name: 'Deny Permission',
      description: 'Permission with deny effect',
      module: 'deny',
      resource: 'permission',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    // Grant with allow effect
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission1.id.toString(),
      effect: 'allow',
    });

    // Grant with deny effect
    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission2.id.toString(),
      effect: 'deny',
    });

    const result = await sut.execute({
      userId: userId.toString(),
      effect: 'deny',
    });

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].permission.code.value).toBe(
      'deny.permission.read',
    );
    expect(result.permissions[0].effect).toBe('deny');
  });

  it('should include permission CONDITIONS in response', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
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

    await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      conditions,
    });

    const result = await sut.execute({
      userId: userId.toString(),
    });

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].conditions).toEqual(conditions);
  });

  it('should not list permissions for NON-EXISTENT user', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(null);

    await expect(
      sut.execute({
        userId: 'non-existent-id',
      }),
    ).rejects.toThrow('User not found');
  });
});
