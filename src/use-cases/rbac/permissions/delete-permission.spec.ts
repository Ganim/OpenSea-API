import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePermissionUseCase } from './delete-permission';

describe('DeletePermissionUseCase', () => {
  let sut: DeletePermissionUseCase;
  let permissionsRepository: InMemoryPermissionsRepository;
  let permissionGroupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let permissionGroupsRepository: InMemoryPermissionGroupsRepository;

  beforeEach(() => {
    permissionsRepository = new InMemoryPermissionsRepository();
    permissionGroupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();

    sut = new DeletePermissionUseCase(
      permissionsRepository,
      permissionGroupPermissionsRepository,
    );
  });

  it('should delete permission that is not in use', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
    });

    expect(result.success).toBe(true);
    expect(await permissionsRepository.findById(permission.id)).toBeNull();
  });

  it('should not delete permission that is in use without force flag', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.update'),
      name: 'Update Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'update',
      isSystem: false,
      metadata: {},
    });

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

    await permissionGroupPermissionsRepository.add({
      groupId: group.id,
      permissionId: permission.id,
      effect: PermissionEffect.create('allow'),
      conditions: null,
    });

    await expect(
      sut.execute({
        permissionId: permission.id.toString(),
      }),
    ).rejects.toThrow('Cannot delete permission. It is assigned to 1 group(s)');

    // Permission should still exist
    expect(await permissionsRepository.findById(permission.id)).toBeTruthy();
  });

  it('should force delete permission that is in use', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.delete'),
      name: 'Delete Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'delete',
      isSystem: false,
      metadata: {},
    });

    const group = await permissionGroupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: null,
    });

    await permissionGroupPermissionsRepository.add({
      groupId: group.id,
      permissionId: permission.id,
      effect: PermissionEffect.create('allow'),
      conditions: null,
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
      force: true,
    });

    expect(result.success).toBe(true);
    expect(await permissionsRepository.findById(permission.id)).toBeNull();
    expect(
      await permissionGroupPermissionsRepository.findByGroupAndPermission(
        group.id,
        permission.id,
      ),
    ).toBeNull();
  });

  it('should delete permission assigned to multiple groups with force', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('sales.orders.create'),
      name: 'Create Orders',
      description: null,
      module: 'sales',
      resource: 'orders',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    const adminGroup = await permissionGroupsRepository.create({
      name: 'Admin',
      slug: 'admin',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#FF0000',
      priority: 100,
      parentId: null,
    });

    const managerGroup = await permissionGroupsRepository.create({
      name: 'Manager',
      slug: 'manager',
      description: null,
      isSystem: false,
      isActive: true,
      color: '#00FF00',
      priority: 50,
      parentId: null,
    });

    await permissionGroupPermissionsRepository.add({
      groupId: adminGroup.id,
      permissionId: permission.id,
      effect: PermissionEffect.create('allow'),
      conditions: null,
    });

    await permissionGroupPermissionsRepository.add({
      groupId: managerGroup.id,
      permissionId: permission.id,
      effect: PermissionEffect.create('allow'),
      conditions: null,
    });

    await expect(
      sut.execute({
        permissionId: permission.id.toString(),
      }),
    ).rejects.toThrow('Cannot delete permission. It is assigned to 2 group(s)');

    const result = await sut.execute({
      permissionId: permission.id.toString(),
      force: true,
    });

    expect(result.success).toBe(true);
    expect(await permissionsRepository.findById(permission.id)).toBeNull();
  });

  it('should not delete non-existent permission', async () => {
    await expect(
      sut.execute({
        permissionId: 'non-existent-id',
      }),
    ).rejects.toThrow('Permission not found');
  });
});
