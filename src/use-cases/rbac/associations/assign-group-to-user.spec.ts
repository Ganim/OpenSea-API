import { User } from '@/entities/core/user';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignGroupToUserUseCase } from './assign-group-to-user';

describe('AssignGroupToUserUseCase', () => {
  let sut: AssignGroupToUserUseCase;
  let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
  let userPermissionGroupsRepository: InMemoryUserPermissionGroupsRepository;
  let usersRepository: InMemoryUsersRepository;

  beforeEach(() => {
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    userPermissionGroupsRepository =
      new InMemoryUserPermissionGroupsRepository();
    usersRepository = new InMemoryUsersRepository();

    sut = new AssignGroupToUserUseCase(
      usersRepository,
      permissionGroupsRepository,
      userPermissionGroupsRepository,
    );
  });

  it('should assign group to user', async () => {
    const userId = new UniqueEntityID();

    // Mock do repositório para retornar um usuário válido
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

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
      userId: userId.toString(),
      groupId: group.id.toString(),
      expiresAt: undefined,
      grantedBy: undefined,
    });

    expect(result.userGroup).toBeDefined();
    const userGroup = result.userGroup;
    expect(userGroup.userId.equals(userId)).toBe(true);
    expect(userGroup.groupId.equals(group.id)).toBe(true);
    expect(userGroup.expiresAt).toBeNull();
  });

  it('should assign group with expiration date', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const group = await permissionGroupsRepository.create({
      name: 'Temporary',
      slug: 'temporary',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: null,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const result = await sut.execute({
      userId: userId.toString(),
      groupId: group.id.toString(),
      expiresAt,
      grantedBy: undefined,
    });

    expect(result.userGroup.expiresAt).toEqual(expiresAt);
  });

  it('should assign group with grantedBy', async () => {
    const userId = new UniqueEntityID();
    const adminId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        id: userId,
        username: Username.create('john_doe'),
        role: 'USER',
      } as unknown as User)
      .mockResolvedValueOnce({
        id: adminId,
        username: Username.create('admin'),
        role: 'ADMIN',
      } as unknown as User);

    const group = await permissionGroupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#0000FF',
      priority: 75,
      parentId: null,
    });

    const result = await sut.execute({
      userId: userId.toString(),
      groupId: group.id.toString(),
      expiresAt: undefined,
      grantedBy: adminId.toString(),
    });

    expect(result.userGroup.grantedBy?.equals(adminId)).toBe(true);
  });

  it('should not assign group to non-existent user', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(null);

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
        userId: 'non-existent-id',
        groupId: group.id.toString(),
        expiresAt: undefined,
        grantedBy: undefined,
      }),
    ).rejects.toThrow('User not found');
  });

  it('should not assign non-existent group to user', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    await expect(
      sut.execute({
        userId: userId.toString(),
        groupId: 'non-existent-group-id',
        expiresAt: undefined,
        grantedBy: undefined,
      }),
    ).rejects.toThrow('Permission group not found');
  });

  it('should not assign group to blocked user', async () => {
    const userId = new UniqueEntityID();

    // Mock de usuário bloqueado (blockedUntil no futuro)
    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + 1); // Bloqueado até amanhã

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('blocked_user'),
      role: 'USER',
      blockedUntil,
      isBlocked: true, // Mockar o getter
    } as unknown as User);

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
        userId: userId.toString(),
        groupId: group.id.toString(),
        expiresAt: undefined,
        grantedBy: undefined,
      }),
    ).rejects.toThrow('Cannot assign group to blocked user');
  });

  it('should not assign inactive group', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const group = await permissionGroupsRepository.create({
      name: 'Inactive',
      slug: 'inactive',
      description: null,
      isSystem: false,
      isActive: false,
      color: '#CCCCCC',
      priority: 10,
      parentId: null,
    });

    await expect(
      sut.execute({
        userId: userId.toString(),
        groupId: group.id.toString(),
        expiresAt: undefined,
        grantedBy: undefined,
      }),
    ).rejects.toThrow('Group must be active and not deleted');
  });

  it('should not assign duplicate group', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

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

    // First assignment
    await sut.execute({
      userId: userId.toString(),
      groupId: group.id.toString(),
      expiresAt: undefined,
      grantedBy: undefined,
    });

    // Try to assign the same group again
    await expect(
      sut.execute({
        userId: userId.toString(),
        groupId: group.id.toString(),
        expiresAt: undefined,
        grantedBy: undefined,
      }),
    ).rejects.toThrow('User already has this group assigned');
  });

  it('should not assign group with past expiration date', async () => {
    const userId = new UniqueEntityID();

    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      id: userId,
      username: Username.create('john_doe'),
      role: 'USER',
    } as unknown as User);

    const group = await permissionGroupsRepository.create({
      name: 'Expired',
      slug: 'expired',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#666666',
      priority: 25,
      parentId: null,
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    await expect(
      sut.execute({
        userId: userId.toString(),
        groupId: group.id.toString(),
        expiresAt: pastDate,
        grantedBy: undefined,
      }),
    ).rejects.toThrow('Expiration date must be in the future');
  });
});
