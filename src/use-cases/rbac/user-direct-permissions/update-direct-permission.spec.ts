import { User } from '@/entities/core/user';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { InMemoryUserDirectPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-user-direct-permissions-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrantDirectPermissionUseCase } from './grant-direct-permission';
import { UpdateDirectPermissionUseCase } from './update-direct-permission';

describe('UpdateDirectPermissionUseCase', () => {
  let sut: UpdateDirectPermissionUseCase;
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

    sut = new UpdateDirectPermissionUseCase(
      userDirectPermissionsRepository,
    );
  });

  it('should update permission EFFECT from allow to deny', async () => {
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

    // Grant permission with allow effect
    const { directPermission } = await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      effect: 'allow',
    });

    // Update to deny
    const result = await sut.execute({
      id: directPermission.id.toString(),
      effect: 'deny',
    });

    expect(result.directPermission.effect).toBe('deny');
  });

  it('should update permission CONDITIONS', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'sales.orders.approve',
      name: 'Approve Orders',
      description: 'Permission to approve orders',
      module: 'sales',
      resource: 'orders',
      action: 'approve',
      isSystem: false,
      metadata: {},
    });

    // Grant permission without conditions
    const { directPermission } = await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    const newConditions = { maxAmount: 5000, currency: 'USD' };

    // Update conditions
    const result = await sut.execute({
      id: directPermission.id.toString(),
      conditions: newConditions,
    });

    expect(result.directPermission.conditions).toEqual(newConditions);
  });

  it('should update permission EXPIRATION', async () => {
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

    // Grant permission without expiration
    const { directPermission } = await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
    });

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 60);

    // Update expiration
    const result = await sut.execute({
      id: directPermission.id.toString(),
      expiresAt: newExpiresAt,
    });

    expect(result.directPermission.expiresAt).toEqual(newExpiresAt);
  });

  it('should REMOVE expiration by setting it to null', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'temp.feature.access',
      name: 'Temporary Feature',
      description: 'Temporary feature access',
      module: 'temp',
      resource: 'feature',
      action: 'access',
      isSystem: false,
      metadata: {},
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Grant permission with expiration
    const { directPermission } = await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      expiresAt,
    });

    // Remove expiration
    const result = await sut.execute({
      id: directPermission.id.toString(),
      expiresAt: null,
    });

    expect(result.directPermission.expiresAt).toBeNull();
  });

  it('should update MULTIPLE fields at once', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'complex.update.test',
      name: 'Complex Update',
      description: 'Test multiple field updates',
      module: 'complex',
      resource: 'update',
      action: 'test',
      isSystem: false,
      metadata: {},
    });

    // Grant permission
    const { directPermission } = await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      effect: 'allow',
    });

    const newConditions = { department: 'IT', level: 'senior' };
    const newExpiresAt = new Date();
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 3);

    // Update multiple fields
    const result = await sut.execute({
      id: directPermission.id.toString(),
      effect: 'deny',
      conditions: newConditions,
      expiresAt: newExpiresAt,
    });

    expect(result.directPermission.effect).toBe('deny');
    expect(result.directPermission.conditions).toEqual(newConditions);
    expect(result.directPermission.expiresAt).toEqual(newExpiresAt);
  });

  it('should not update NON-EXISTENT permission', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        effect: 'deny',
      }),
    ).rejects.toThrow('Direct permission not found');
  });

  it('should REMOVE conditions by setting them to null', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const permission = await permissionsRepository.create({
      code: 'conditional.access.read',
      name: 'Conditional Access',
      description: 'Access with conditions',
      module: 'conditional',
      resource: 'access',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const conditions = { region: 'US', role: 'manager' };

    // Grant permission with conditions
    const { directPermission } = await grantUseCase.execute({
      userId: userId.toString(),
      permissionId: permission.id.toString(),
      conditions,
    });

    // Remove conditions
    const result = await sut.execute({
      id: directPermission.id.toString(),
      conditions: null,
    });

    expect(result.directPermission.conditions).toBeNull();
  });
});
