import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Permission } from '@/entities/rbac/permission';
import type { PermissionGroup } from '@/entities/rbac/permission-group';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemovePermissionFromGroupUseCase } from './remove-permission-from-group';

describe('RemovePermissionFromGroupUseCase', () => {
  let useCase: RemovePermissionFromGroupUseCase;
  let groupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let permissionsRepository: InMemoryPermissionsRepository;
  let groupsRepository: InMemoryPermissionGroupsRepository;
  let testPermission: Permission;
  let testGroup: PermissionGroup;

  beforeEach(async () => {
    groupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    permissionsRepository = new InMemoryPermissionsRepository();
    groupsRepository = new InMemoryPermissionGroupsRepository();
    useCase = new RemovePermissionFromGroupUseCase(
      groupPermissionsRepository,
      permissionsRepository,
      groupsRepository,
    );

    // Create test permission
    testPermission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

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

    // Add permission to group
    await groupPermissionsRepository.add({
      groupId: testGroup.id,
      permissionId: testPermission.id,
      effect: PermissionEffect.allow(),
      conditions: null,
    });
  });

  it('should remove permission from group', async () => {
    const result = await useCase.execute({
      groupId: testGroup.id.toString(),
      permissionId: testPermission.id.toString(),
    });

    expect(result.success).toBe(true);

    const exists = await groupPermissionsRepository.exists(
      testGroup.id,
      testPermission.id,
    );
    expect(exists).toBe(false);
  });

  it('should throw error when group not found', async () => {
    await expect(
      useCase.execute({
        groupId: 'non-existent-group',
        permissionId: testPermission.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error when permission not found', async () => {
    await expect(
      useCase.execute({
        groupId: testGroup.id.toString(),
        permissionId: 'non-existent-permission',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should succeed even if permission was not in group', async () => {
    const otherPermission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.write'),
      name: 'Write Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'write',
      isSystem: false,
      metadata: {},
    });
    const result = await useCase.execute({
      groupId: testGroup.id.toString(),
      permissionId: otherPermission.id.toString(),
    });

    expect(result.success).toBe(true);
  });
});
