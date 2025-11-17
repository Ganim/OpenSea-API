import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPermissionGroupByIdUseCase } from './get-permission-group-by-id';

describe('GetPermissionGroupByIdUseCase', () => {
  let useCase: GetPermissionGroupByIdUseCase;
  let repository: InMemoryPermissionGroupsRepository;

  beforeEach(() => {
    repository = new InMemoryPermissionGroupsRepository();
    useCase = new GetPermissionGroupByIdUseCase(repository);
  });

  it('should get permission group by id', async () => {
    const group = await repository.create({
      name: 'Admin Group',
      slug: 'admin-group',
      description: 'Admin permissions',
      color: '#FF0000',
      parentId: null,
      priority: 100,
      isSystem: false,
      isActive: true,
    });

    const result = await useCase.execute({ id: group.id.toString() });

    expect(result.group).toBe(group);
    expect(result.group.name).toBe('Admin Group');
    expect(result.group.slug).toBe('admin-group');
  });

  it('should get system group', async () => {
    const group = await repository.create({
      name: 'System Group',
      slug: 'system-group',
      description: null,
      color: null,
      parentId: null,
      priority: 100,
      isSystem: true,
      isActive: true,
    });

    const result = await useCase.execute({ id: group.id.toString() });

    expect(result.group.isSystem).toBe(true);
  });

  it('should get group with parent', async () => {
    const parentGroup = await repository.create({
      name: 'Parent Group',
      slug: 'parent-group',
      description: null,
      color: null,
      parentId: null,
      priority: 100,
      isSystem: false,
      isActive: true,
    });

    const childGroup = await repository.create({
      name: 'Child Group',
      slug: 'child-group',
      description: null,
      color: null,
      parentId: parentGroup.id,
      priority: 50,
      isSystem: false,
      isActive: true,
    });

    const result = await useCase.execute({ id: childGroup.id.toString() });

    expect(result.group.parentId).toBeDefined();
    expect(result.group.parentId?.equals(parentGroup.id)).toBe(true);
  });

  it('should throw error when group not found', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
