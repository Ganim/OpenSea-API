import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPermissionByCodeUseCase } from './get-permission-by-code';

describe('GetPermissionByCodeUseCase', () => {
  let sut: GetPermissionByCodeUseCase;
  let permissionsRepository: InMemoryPermissionsRepository;

  beforeEach(() => {
    permissionsRepository = new InMemoryPermissionsRepository();
    sut = new GetPermissionByCodeUseCase(permissionsRepository);
  });

  it('should get permission by code', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: 'Allows reading products',
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
      metadata: { category: 'inventory' },
    });

    const result = await sut.execute({
      code: 'stock.products.read',
    });

    expect(result.permission.id.equals(permission.id)).toBe(true);
    expect(result.permission.code.value).toBe('stock.products.read');
    expect(result.permission.name).toBe('Read Products');
  });

  it('should get permission with wildcard', async () => {
    const permission = await permissionsRepository.create({
      code: PermissionCode.create('stock.products.*'),
      name: 'All Products Actions',
      description: 'Allows all actions on products',
      module: 'stock',
      resource: 'products',
      action: '*',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({
      code: 'stock.products.*',
    });

    expect(result.permission.id.equals(permission.id)).toBe(true);
    expect(result.permission.action).toBe('*');
  });

  it('should not get non-existent permission', async () => {
    await expect(
      sut.execute({
        code: 'non.existent.permission',
      }),
    ).rejects.toThrow('Permission not found');
  });

  it('should validate permission code format', async () => {
    await expect(
      sut.execute({
        code: 'invalid-format',
      }),
    ).rejects.toThrow();
  });
});
