import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { PermissionGroup } from '@/entities/rbac/permission-group';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListGroupPermissionsUseCase } from './list-group-permissions';

describe('ListGroupPermissionsUseCase', () => {
  let useCase: ListGroupPermissionsUseCase;
  let groupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let groupsRepository: InMemoryPermissionGroupsRepository;
  let permissionsRepository: InMemoryPermissionsRepository;
  let testGroup: PermissionGroup;

  beforeEach(async () => {
    groupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    groupsRepository = new InMemoryPermissionGroupsRepository();
    permissionsRepository = new InMemoryPermissionsRepository();

    // Link repositories
    groupPermissionsRepository.permissions = permissionsRepository.items;

    useCase = new ListGroupPermissionsUseCase(
      groupPermissionsRepository,
      groupsRepository,
    );

    // Create test group
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
  });

  it('should list all permissions of a group', async () => {
    const code1 = PermissionCode.create('stock.products.read');
    const perm1 = await permissionsRepository.create({
      code: code1,
      name: 'Read Products',
      description: null,
      module: code1.module,
      resource: code1.resource,
      action: code1.action,
      isSystem: false,
      metadata: {},
    });

    const code2 = PermissionCode.create('stock.products.write');
    const perm2 = await permissionsRepository.create({
      code: code2,
      name: 'Write Products',
      description: null,
      module: code2.module,
      resource: code2.resource,
      action: code2.action,
      isSystem: false,
      metadata: {},
    });

    await groupPermissionsRepository.add({
      groupId: testGroup.id,
      permissionId: perm1.id,
      effect: PermissionEffect.allow(),
      conditions: null,
    });

    await groupPermissionsRepository.add({
      groupId: testGroup.id,
      permissionId: perm2.id,
      effect: PermissionEffect.allow(),
      conditions: null,
    });

    const result = await useCase.execute({
      groupId: testGroup.id.toString(),
    });

    expect(result.permissions).toHaveLength(2);
    expect(result.permissions[0].effect).toBe('allow');
    expect(result.permissions[1].effect).toBe('allow');
  });

  it('should list permissions with different effects', async () => {
    const code1 = PermissionCode.create('stock.products.read');
    const perm1 = await permissionsRepository.create({
      code: code1,
      name: 'Read Products',
      description: null,
      module: code1.module,
      resource: code1.resource,
      action: code1.action,
      isSystem: false,
      metadata: {},
    });

    const code2 = PermissionCode.create('stock.products.delete');
    const perm2 = await permissionsRepository.create({
      code: code2,
      name: 'Delete Products',
      description: null,
      module: code2.module,
      resource: code2.resource,
      action: code2.action,
      isSystem: false,
      metadata: {},
    });

    await groupPermissionsRepository.add({
      groupId: testGroup.id,
      permissionId: perm1.id,
      effect: PermissionEffect.allow(),
      conditions: null,
    });

    await groupPermissionsRepository.add({
      groupId: testGroup.id,
      permissionId: perm2.id,
      effect: PermissionEffect.deny(),
      conditions: null,
    });

    const result = await useCase.execute({
      groupId: testGroup.id.toString(),
    });

    expect(result.permissions).toHaveLength(2);
    expect(result.permissions[0].effect).toBe('allow');
    expect(result.permissions[1].effect).toBe('deny');
  });

  it('should list permissions with conditions', async () => {
    const code = PermissionCode.create('stock.products.update');
    const perm = await permissionsRepository.create({
      code,
      name: 'Update Products',
      description: null,
      module: code.module,
      resource: code.resource,
      action: code.action,
      isSystem: false,
      metadata: {},
    });

    await groupPermissionsRepository.add({
      groupId: testGroup.id,
      permissionId: perm.id,
      effect: PermissionEffect.allow(),
      conditions: { ownedBy: 'user' },
    });

    const result = await useCase.execute({
      groupId: testGroup.id.toString(),
    });

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].conditions).toBeDefined();
  });

  it('should return empty array for group without permissions', async () => {
    const result = await useCase.execute({
      groupId: testGroup.id.toString(),
    });

    expect(result.permissions).toHaveLength(0);
  });

  it('should throw error when group not found', async () => {
    await expect(
      useCase.execute({ groupId: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
