import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddPermissionToGroupUseCase } from './add-permission-to-group';

describe('AddPermissionToGroupUseCase', () => {
  let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
  let permissionsRepository: InMemoryPermissionsRepository;
  let permissionGroupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let sut: AddPermissionToGroupUseCase;

  beforeEach(async () => {
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    permissionsRepository = new InMemoryPermissionsRepository();
    permissionGroupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();

    sut = new AddPermissionToGroupUseCase(
      permissionGroupsRepository,
      permissionsRepository,
      permissionGroupPermissionsRepository,
    );
  });

  it('should add permission to group with allow effect', async () => {
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

    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.create'),
      name: 'Create Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    const { groupPermission } = await sut.execute({
      groupId: group.id.toString(),
      permissionCode: 'stock.products.create',
      effect: 'allow',
    });

    expect(groupPermission.groupId.equals(group.id)).toBe(true);
    expect(groupPermission.permissionId.equals(permission.id)).toBe(true);
    expect(groupPermission.effect.isAllow).toBe(true);
  });

  it('should add permission to group with deny effect', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'User',
      slug: 'user',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: null,
    });

    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.delete'),
      name: 'Delete Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'delete',
      isSystem: false,
      metadata: {},
    });

    const { groupPermission } = await sut.execute({
      groupId: group.id.toString(),
      permissionCode: 'stock.products.delete',
      effect: 'deny',
    });

    expect(groupPermission.effect.isDeny).toBe(true);
  });

  it('should add permission with conditions', async () => {
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

    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.update'),
      name: 'Update Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'update',
      isSystem: false,
      metadata: {},
    });

    const { groupPermission } = await sut.execute({
      groupId: group.id.toString(),
      permissionCode: 'stock.products.update',
      effect: 'allow',
      conditions: {
        ownedBy: 'self',
        maxValue: 1000,
      },
    });

    expect(groupPermission.conditions).toEqual({
      ownedBy: 'self',
      maxValue: 1000,
    });
  });

  it('should not add permission to non-existent group', async () => {
    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.create'),
      name: 'Create Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    await expect(() =>
      sut.execute({
        groupId: 'non-existent-id',
        permissionCode: 'stock.products.create',
        effect: 'allow',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not add non-existent permission to group', async () => {
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

    await expect(() =>
      sut.execute({
        groupId: group.id.toString(),
        permissionCode: 'non.existent.permission',
        effect: 'allow',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not add permission to inactive group', async () => {
    const group = await permissionGroupsRepository.create({
      name: 'Inactive',
      slug: 'inactive',
      description: null,
      isSystem: false,
      isActive: false,
      color: '#CCCCCC',
      priority: 0,
      parentId: null,
    });

    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.create'),
      name: 'Create Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    await expect(() =>
      sut.execute({
        groupId: group.id.toString(),
        permissionCode: 'stock.products.create',
        effect: 'allow',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not add duplicate permission to group', async () => {
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

    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.create'),
      name: 'Create Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    await sut.execute({
      groupId: group.id.toString(),
      permissionCode: 'stock.products.create',
      effect: 'allow',
    });

    await expect(() =>
      sut.execute({
        groupId: group.id.toString(),
        permissionCode: 'stock.products.create',
        effect: 'deny',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
