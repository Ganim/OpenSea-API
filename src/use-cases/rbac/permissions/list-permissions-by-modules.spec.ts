import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { ListPermissionsByModulesUseCase } from './list-permissions-by-modules';

let permissionsRepository: InMemoryPermissionsRepository;
let sut: ListPermissionsByModulesUseCase;

describe('List Permissions By Modules Use Case', () => {
  beforeEach(() => {
    permissionsRepository = new InMemoryPermissionsRepository();
    sut = new ListPermissionsByModulesUseCase(permissionsRepository);
  });

  it('should list permissions grouped by modules', async () => {
    // Criar permissões de diferentes módulos
    const permission1 = await makePermission({
      module: 'stock',
      resource: 'products',
      action: 'read',
    });
    const permission2 = await makePermission({
      module: 'stock',
      resource: 'products',
      action: 'create',
    });
    const permission3 = await makePermission({
      module: 'core',
      resource: 'users',
      action: 'read',
    });
    const permission4 = await makePermission({
      module: 'core',
      resource: 'users',
      action: 'update',
    });

    // Adicionar permissões ao repositório
    await permissionsRepository.create({
      code: permission1.code,
      name: permission1.name,
      description: permission1.description,
      module: permission1.module,
      resource: permission1.resource,
      action: permission1.action,
      isSystem: permission1.isSystem,
      metadata: permission1.metadata,
    });
    await permissionsRepository.create({
      code: permission2.code,
      name: permission2.name,
      description: permission2.description,
      module: permission2.module,
      resource: permission2.resource,
      action: permission2.action,
      isSystem: permission2.isSystem,
      metadata: permission2.metadata,
    });
    await permissionsRepository.create({
      code: permission3.code,
      name: permission3.name,
      description: permission3.description,
      module: permission3.module,
      resource: permission3.resource,
      action: permission3.action,
      isSystem: permission3.isSystem,
      metadata: permission3.metadata,
    });
    await permissionsRepository.create({
      code: permission4.code,
      name: permission4.name,
      description: permission4.description,
      module: permission4.module,
      resource: permission4.resource,
      action: permission4.action,
      isSystem: permission4.isSystem,
      metadata: permission4.metadata,
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
    const systemPermission = await makePermission({
      module: 'rbac',
      resource: 'permissions',
      action: 'read',
      isSystem: true,
    });
    const regularPermission = await makePermission({
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: false,
    });

    await permissionsRepository.create({
      code: systemPermission.code,
      name: systemPermission.name,
      description: systemPermission.description,
      module: systemPermission.module,
      resource: systemPermission.resource,
      action: systemPermission.action,
      isSystem: systemPermission.isSystem,
      metadata: systemPermission.metadata,
    });
    await permissionsRepository.create({
      code: regularPermission.code,
      name: regularPermission.name,
      description: regularPermission.description,
      module: regularPermission.module,
      resource: regularPermission.resource,
      action: regularPermission.action,
      isSystem: regularPermission.isSystem,
      metadata: regularPermission.metadata,
    });

    const result = await sut.execute({ includeSystem: false });

    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].module).toBe('stock');
    expect(result.totalPermissions).toBe(1);
  });

  it('should include system permissions by default', async () => {
    const systemPermission = await makePermission({
      module: 'rbac',
      resource: 'permissions',
      action: 'read',
      isSystem: true,
    });

    await permissionsRepository.create({
      code: systemPermission.code,
      name: systemPermission.name,
      description: systemPermission.description,
      module: systemPermission.module,
      resource: systemPermission.resource,
      action: systemPermission.action,
      isSystem: systemPermission.isSystem,
      metadata: systemPermission.metadata,
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
