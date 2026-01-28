import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { ListPermissionsByModulesUseCase } from './list-permissions-by-modules';

let permissionsRepository: InMemoryPermissionsRepository;
let sut: ListPermissionsByModulesUseCase;

describe('List Permissions By Modules Use Case', () => {
  beforeEach(() => {
    permissionsRepository = new InMemoryPermissionsRepository();
    sut = new ListPermissionsByModulesUseCase(permissionsRepository);
  });

  it('should list permissions grouped by modules', async () => {
    // Criar permissões de diferentes módulos diretamente no repositório
    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: 'Read products permission',
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
      metadata: {},
    });
    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.create'),
      name: 'Create Products',
      description: 'Create products permission',
      module: 'stock',
      resource: 'products',
      action: 'create',
      isSystem: false,
      metadata: {},
    });
    await permissionsRepository.create({
      code: PermissionCode.create('core.users.read'),
      name: 'Read Users',
      description: 'Read users permission',
      module: 'core',
      resource: 'users',
      action: 'read',
      isSystem: false,
      metadata: {},
    });
    await permissionsRepository.create({
      code: PermissionCode.create('core.users.update'),
      name: 'Update Users',
      description: 'Update users permission',
      module: 'core',
      resource: 'users',
      action: 'update',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute();

    expect(result.modules).toHaveLength(2);
    expect(result.totalPermissions).toBe(4);

    // Verificar módulo stock
    const stockModule = result.modules.find((m) => m.module === 'stock');
    expect(stockModule).toBeDefined();
    expect(stockModule!.permissions).toHaveLength(2);
    expect(stockModule!.total).toBe(2);

    // Verificar módulo core
    const coreModule = result.modules.find((m) => m.module === 'core');
    expect(coreModule).toBeDefined();
    expect(coreModule!.permissions).toHaveLength(2);
    expect(coreModule!.total).toBe(2);

    // Verificar ordenação dos módulos
    expect(result.modules[0].module).toBe('core');
    expect(result.modules[1].module).toBe('stock');
  });

  it('should filter out system permissions when includeSystem is false', async () => {
    await permissionsRepository.create({
      code: PermissionCode.create('rbac.permissions.read'),
      name: 'Read Permissions',
      description: 'Read permissions permission',
      module: 'rbac',
      resource: 'permissions',
      action: 'read',
      isSystem: true,
      metadata: {},
    });
    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: 'Read products permission',
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute({ includeSystem: false });

    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].module).toBe('stock');
    expect(result.totalPermissions).toBe(1);
  });

  it('should include system permissions by default', async () => {
    await permissionsRepository.create({
      code: PermissionCode.create('rbac.permissions.read'),
      name: 'Read Permissions',
      description: 'Read permissions permission',
      module: 'rbac',
      resource: 'permissions',
      action: 'read',
      isSystem: true,
      metadata: {},
    });

    const result = await sut.execute();

    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].module).toBe('rbac');
    expect(result.totalPermissions).toBe(1);
  });

  it('should return empty array when no permissions exist', async () => {
    const result = await sut.execute();

    expect(result.modules).toHaveLength(0);
    expect(result.totalPermissions).toBe(0);
  });

  it('should sort permissions within modules by resource and action', async () => {
    await permissionsRepository.create({
      code: PermissionCode.create('stock.categories.read'),
      name: 'Read Categories',
      description: 'Read categories permission',
      module: 'stock',
      resource: 'categories',
      action: 'read',
      isSystem: false,
      metadata: {},
    });
    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.create'),
      name: 'Create Products',
      description: 'Create products permission',
      module: 'stock',
      resource: 'products',
      action: 'create',
      isSystem: false,
      metadata: {},
    });
    await permissionsRepository.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: 'Read products permission',
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
      metadata: {},
    });

    const result = await sut.execute();
    const stockModule = result.modules.find((m) => m.module === 'stock');

    expect(stockModule!.permissions[0].resource).toBe('categories');
    expect(stockModule!.permissions[0].action).toBe('read');
    expect(stockModule!.permissions[1].resource).toBe('products');
    expect(stockModule!.permissions[1].action).toBe('create');
    expect(stockModule!.permissions[2].resource).toBe('products');
    expect(stockModule!.permissions[2].action).toBe('read');
  });
});
