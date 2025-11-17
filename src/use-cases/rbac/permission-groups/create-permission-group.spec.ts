import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePermissionGroupUseCase } from './create-permission-group';

describe('CreatePermissionGroupUseCase', () => {
  let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
  let sut: CreatePermissionGroupUseCase;

  beforeEach(() => {
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    sut = new CreatePermissionGroupUseCase(permissionGroupsRepository);
  });

  it('should create a new permission group', async () => {
    const { group } = await sut.execute({
      name: 'Administrators',
      slug: 'admin',
      description: 'System administrators',
      color: '#FF0000',
      priority: 100,
    });

    expect(group.id).toBeTruthy();
    expect(group.name).toBe('Administrators');
    expect(group.slug).toBe('admin');
    expect(group.isActive).toBe(true);
    expect(group.isSystem).toBe(false);
  });

  it('should create a system group', async () => {
    const { group } = await sut.execute({
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Super administrators',
      color: '#000000',
      isSystem: true,
    });

    expect(group.isSystem).toBe(true);
  });

  it('should create an inactive group', async () => {
    const { group } = await sut.execute({
      name: 'Inactive Group',
      slug: 'inactive',
      description: null,
      color: '#CCCCCC',
      isActive: false,
    });

    expect(group.isActive).toBe(false);
  });

  it('should create a group with parent', async () => {
    const { group: parentGroup } = await sut.execute({
      name: 'Managers',
      slug: 'managers',
      description: 'All managers',
      color: '#00FF00',
    });

    const { group } = await sut.execute({
      name: 'Sales Managers',
      slug: 'sales-managers',
      description: 'Sales department managers',
      color: '#0000FF',
      parentId: parentGroup.id.toString(),
    });

    expect(group.parentId).toBeTruthy();
    expect(group.parentId?.equals(parentGroup.id)).toBe(true);
  });

  it('should not create group with duplicate slug', async () => {
    await sut.execute({
      name: 'First Group',
      slug: 'duplicate',
      description: null,
      color: '#FF0000',
    });

    await expect(() =>
      sut.execute({
        name: 'Second Group',
        slug: 'duplicate',
        description: null,
        color: '#00FF00',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create group with duplicate name', async () => {
    await sut.execute({
      name: 'Duplicate Name',
      slug: 'first',
      description: null,
      color: '#FF0000',
    });

    await expect(() =>
      sut.execute({
        name: 'Duplicate Name',
        slug: 'second',
        description: null,
        color: '#00FF00',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create group with non-existent parent', async () => {
    await expect(() =>
      sut.execute({
        name: 'Child Group',
        slug: 'child',
        description: null,
        color: '#FF0000',
        parentId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create group with deleted parent', async () => {
    const { group: parentGroup } = await sut.execute({
      name: 'Parent',
      slug: 'parent',
      description: null,
      color: '#FF0000',
    });

    // Deletar o grupo pai
    await permissionGroupsRepository.delete(parentGroup.id);

    await expect(() =>
      sut.execute({
        name: 'Child',
        slug: 'child',
        description: null,
        color: '#00FF00',
        parentId: parentGroup.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
