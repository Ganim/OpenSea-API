import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePermissionUseCase } from './update-permission';

describe('UpdatePermissionUseCase', () => {
  let sut: UpdatePermissionUseCase;
  let permissionsRepository: InMemoryPermissionsRepository;

  beforeEach(() => {
    permissionsRepository = new InMemoryPermissionsRepository();
    sut = new UpdatePermissionUseCase(permissionsRepository);
  });

  it('should update permission name', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: 'Allows reading products',
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
      name: 'View Products',
    });

    expect(result.permission.name).toBe('View Products');
    expect(result.permission.description).toBe('Allows reading products');
  });

  it('should update permission description', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.update'),
      name: 'Update Products',
      description: 'Old description',
      module: 'stock',
      resource: 'products',
      action: 'update',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
      description: 'New description for updating products',
    });

    expect(result.permission.description).toBe(
      'New description for updating products',
    );
    expect(result.permission.name).toBe('Update Products');
  });

  it('should update permission metadata', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.delete'),
      name: 'Delete Products',
      description: null,
      module: 'stock',
      resource: 'products',
      action: 'delete',
      isSystem: false,
      metadata: { category: 'inventory' },
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
      metadata: { category: 'stock', level: 'high' },
    });

    expect(result.permission.metadata).toEqual({
      category: 'stock',
      level: 'high',
    });
  });

  it('should update multiple fields at once', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('sales.orders.create'),
      name: 'Create Orders',
      description: 'Old description',
      module: 'sales',
      resource: 'orders',
      action: 'create',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
      name: 'New Order Creation',
      description: 'Create new sales orders in the system',
      metadata: { critical: true },
    });

    expect(result.permission.name).toBe('New Order Creation');
    expect(result.permission.description).toBe(
      'Create new sales orders in the system',
    );
    expect(result.permission.metadata).toEqual({ critical: true });
  });

  it('should not update permission code', async () => {
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
      name: 'Updated Name',
    });

    // Code should remain immutable
    expect(result.permission.code.value).toBe('stock.products.read');
    expect(result.permission.module).toBe('stock');
    expect(result.permission.resource).toBe('products');
    expect(result.permission.action).toBe('read');
  });

  it('should not update non-existent permission', async () => {
    await expect(
      sut.execute({
        permissionId: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow('Permission not found');
  });

  it('should clear description when set to null', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.items.read'),
      name: 'Read Items',
      description: 'Some description',
      module: 'stock',
      resource: 'items',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      permissionId: permission.id.toString(),
      description: null,
    });

    expect(result.permission.description).toBeNull();
  });
});
