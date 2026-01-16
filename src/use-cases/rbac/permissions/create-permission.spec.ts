import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePermissionUseCase } from './create-permission';

describe('CreatePermissionUseCase', () => {
  let permissionsRepository: InMemoryPermissionsRepository;
  let sut: CreatePermissionUseCase;

  beforeEach(() => {
    permissionsRepository = new InMemoryPermissionsRepository();
    sut = new CreatePermissionUseCase(permissionsRepository);
  });

  it('should create a new permission', async () => {
    const { permission } = await sut.execute({
      code: 'stock.products.create',
      name: 'Create Products',
      description: 'Allows creating products',
      module: 'stock',
      resource: 'products',
      action: 'create',
    });

    expect(permission.id).toBeTruthy();
    expect(permission.code.value).toBe('stock.products.create');
    expect(permission.name).toBe('Create Products');
    expect(permission.module).toBe('stock');
    expect(permission.isSystem).toBe(false);
  });

  it('should create a system permission', async () => {
    const { permission } = await sut.execute({
      code: 'core.users.admin',
      name: 'Admin Users',
      description: 'Full user management',
      module: 'core',
      resource: 'users',
      action: 'admin',
      isSystem: true,
    });

    expect(permission.isSystem).toBe(true);
  });

  it('should create permission with metadata', async () => {
    const { permission } = await sut.execute({
      code: 'stock.products.create',
      name: 'Create Products',
      description: 'Allows creating products',
      module: 'stock',
      resource: 'products',
      action: 'create',
      metadata: {
        category: 'inventory',
        priority: 'high',
      },
    });

    expect(permission.metadata).toEqual({
      category: 'inventory',
      priority: 'high',
    });
  });

  it('should not create permission with duplicate code', async () => {
    await sut.execute({
      code: 'stock.products.create',
      name: 'Create Products',
      description: 'Allows creating products',
      module: 'stock',
      resource: 'products',
      action: 'create',
    });

    await expect(() =>
      sut.execute({
        code: 'stock.products.create',
        name: 'Create Products Again',
        description: 'Duplicate',
        module: 'stock',
        resource: 'products',
        action: 'create',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create permission with invalid code format', async () => {
    // Caracteres especiais (@, !) não são permitidos no código de permissão
    await expect(() =>
      sut.execute({
        code: 'invalid@code!',
        name: 'Invalid Permission',
        description: null,
        module: 'stock',
        resource: 'products',
        action: 'create',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should create permission with wildcard in action', async () => {
    const { permission } = await sut.execute({
      code: 'stock.products.*',
      name: 'All Products Actions',
      description: 'Full access to products',
      module: 'stock',
      resource: 'products',
      action: '*',
    });

    expect(permission.code.value).toBe('stock.products.*');
    expect(permission.action).toBe('*');
  });
});
