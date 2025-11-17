import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPermissionGroupsUseCase } from './list-permission-groups';

describe('ListPermissionGroupsUseCase', () => {
  let useCase: ListPermissionGroupsUseCase;
  let repository: InMemoryPermissionGroupsRepository;

  beforeEach(async () => {
    repository = new InMemoryPermissionGroupsRepository();
    useCase = new ListPermissionGroupsUseCase(repository);

    // Criar grupos de teste
    // Grupo pai 1 (ativo, não sistema)
    const parent1 = await repository.create({
      name: 'Admin Group',
      slug: 'admin-group',
      description: null,
      color: '#FF0000',
      parentId: null,
      isSystem: false,
      isActive: true,
      priority: 100,
    });

    // Filho do parent1 (ativo)
    await repository.create({
      name: 'Sub Admin',
      slug: 'sub-admin',
      description: null,
      color: '#FF5555',
      parentId: parent1.id,
      isSystem: false,
      isActive: true,
      priority: 90,
    });

    // Grupo sistema (ativo)
    await repository.create({
      name: 'System Group',
      slug: 'system-group',
      description: null,
      color: '#000000',
      parentId: null,
      isSystem: true,
      isActive: true,
      priority: 200,
    });

    // Grupo inativo
    await repository.create({
      name: 'Inactive Group',
      slug: 'inactive-group',
      description: null,
      color: '#CCCCCC',
      parentId: null,
      isSystem: false,
      isActive: false,
      priority: 10,
    });
  });

  it('should list all groups', async () => {
    const result = await useCase.execute({});

    expect(result.groups).toHaveLength(4);
  });

  it('should list only active groups', async () => {
    const result = await useCase.execute({ isActive: true });

    expect(result.groups).toHaveLength(3);
    expect(result.groups.every((g) => g.isActive)).toBe(true);
  });

  it('should list only inactive groups', async () => {
    const result = await useCase.execute({ isActive: false });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe('Inactive Group');
  });

  it('should list only system groups', async () => {
    const result = await useCase.execute({ isSystem: true });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe('System Group');
  });

  it('should list only non-system groups', async () => {
    const result = await useCase.execute({ isSystem: false });

    expect(result.groups).toHaveLength(3);
    expect(result.groups.every((g) => !g.isSystem)).toBe(true);
  });

  it('should list groups by parent', async () => {
    const parent = await repository.findBySlug('admin-group');
    const result = await useCase.execute({ parentId: parent!.id.toString() });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe('Sub Admin');
  });

  it('should list active system groups', async () => {
    const result = await useCase.execute({ isActive: true, isSystem: true });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe('System Group');
  });
});
