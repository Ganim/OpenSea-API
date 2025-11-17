import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPermissionsUseCase } from './list-permissions';

describe('ListPermissionsUseCase', () => {
  let permissionsRepository: InMemoryPermissionsRepository;
  let sut: ListPermissionsUseCase;

  beforeEach(async () => {
    permissionsRepository = new InMemoryPermissionsRepository();
    sut = new ListPermissionsUseCase(permissionsRepository);

    // Criar permissões de teste
    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.create'),
      name: 'Create Products',
      description: 'Create products',
      module: 'stock',
      resource: 'products',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: 'Read products',
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    await permissionsRepository.create({
      code: PermissionCode.create('sales.orders.create'),
      name: 'Create Orders',
      description: 'Create orders',
      module: 'sales',
      resource: 'orders',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    await permissionsRepository.create({
      code: PermissionCode.create('core.users.admin'),
      name: 'Admin Users',
      description: 'Admin users',
      module: 'core',
      resource: 'users',
      action: 'admin',
      isSystem: true,
      metadata: {},
    });
  });

  it('should list all permissions', async () => {
    const { permissions, total } = await sut.execute();

    expect(permissions).toHaveLength(4);
    expect(total).toBe(4);
  });

  it('should filter permissions by module', async () => {
    const { permissions } = await sut.execute({ module: 'stock' });

    expect(permissions).toHaveLength(2);
    expect(permissions.every((p) => p.module === 'stock')).toBe(true);
  });

  it('should filter permissions by resource', async () => {
    const { permissions } = await sut.execute({ resource: 'products' });

    expect(permissions).toHaveLength(2);
    expect(permissions.every((p) => p.resource === 'products')).toBe(true);
  });

  it('should filter permissions by action', async () => {
    const { permissions } = await sut.execute({ action: 'create' });

    expect(permissions).toHaveLength(2);
    expect(permissions.every((p) => p.action === 'create')).toBe(true);
  });

  it('should filter system permissions', async () => {
    const { permissions } = await sut.execute({ isSystem: true });

    expect(permissions).toHaveLength(1);
    expect(permissions[0].code.value).toBe('core.users.admin');
  });

  it('should filter non-system permissions', async () => {
    const { permissions } = await sut.execute({ isSystem: false });

    expect(permissions).toHaveLength(3);
    expect(permissions.every((p) => !p.isSystem)).toBe(true);
  });

  it('should paginate results', async () => {
    const { permissions } = await sut.execute({ page: 1, limit: 2 });

    expect(permissions).toHaveLength(2);
  });

  it('should combine multiple filters', async () => {
    const { permissions } = await sut.execute({
      module: 'stock',
      resource: 'products',
      action: 'read',
    });

    expect(permissions).toHaveLength(1);
    expect(permissions[0].code.value).toBe('stock.products.read');
  });
});
