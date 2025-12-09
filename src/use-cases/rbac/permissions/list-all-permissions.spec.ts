import { describe, it, expect, beforeEach } from 'vitest'
import { ListAllPermissionsUseCase } from './list-all-permissions'
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository'
import { Permission } from '@/entities/rbac/permission'
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code'

describe('List All Permissions Use Case', () => {
  let permissionsRepository: InMemoryPermissionsRepository
  let sut: ListAllPermissionsUseCase

  beforeEach(() => {
    permissionsRepository = new InMemoryPermissionsRepository()
    sut = new ListAllPermissionsUseCase(permissionsRepository)
  })

  it('should be able to list all permissions grouped by module and resource', async () => {
    // Cria permissões de teste
    const permission1 = Permission.create({
      code: PermissionCode.create('core.users.read'),
      name: 'Read Users',
      description: 'Read users',
      module: 'core',
      resource: 'users',
      action: 'read',
      isSystem: true,
      metadata: {},
    })

    const permission2 = Permission.create({
      code: PermissionCode.create('core.users.create'),
      name: 'Create Users',
      description: 'Create users',
      module: 'core',
      resource: 'users',
      action: 'create',
      isSystem: true,
      metadata: {},
    })

    const permission3 = Permission.create({
      code: PermissionCode.create('stock.products.read'),
      name: 'Read Products',
      description: 'Read products',
      module: 'stock',
      resource: 'products',
      action: 'read',
      isSystem: true,
      metadata: {},
    })

    await permissionsRepository.create(permission1)
    await permissionsRepository.create(permission2)
    await permissionsRepository.create(permission3)

    // Executa o use case
    const result = await sut.execute()

    // Validações
    expect(result.total).toBe(3)
    expect(result.modules).toHaveLength(2)
    expect(result.modules).toContain('CORE')
    expect(result.modules).toContain('STOCK')

    // Verifica estrutura do módulo CORE
    const coreModule = result.permissions.find((m) => m.module === 'CORE')
    expect(coreModule).toBeDefined()
    expect(coreModule?.description).toBeTruthy()
    expect(coreModule?.resources.users).toBeDefined()
    expect(coreModule?.resources.users.permissions).toHaveLength(2)

    // Verifica estrutura do módulo STOCK
    const stockModule = result.permissions.find((m) => m.module === 'STOCK')
    expect(stockModule).toBeDefined()
    expect(stockModule?.description).toBeTruthy()
    expect(stockModule?.resources.products).toBeDefined()
    expect(stockModule?.resources.products.permissions).toHaveLength(1)
  })

  it('should mark deprecated permissions correctly', async () => {
    // Cria uma permissão normal
    const normalPermission = Permission.create({
      code: PermissionCode.create('core.users.read'),
      name: 'Read Users',
      description: 'Read users',
      module: 'core',
      resource: 'users',
      action: 'read',
      isSystem: true,
      metadata: {},
    })

    // Cria uma permissão deprecated
    const deprecatedPermission = Permission.create({
      code: PermissionCode.create('core.users.delete'),
      name: 'Delete Users',
      description: 'Delete users',
      module: 'core',
      resource: 'users',
      action: 'delete',
      isSystem: true,
      metadata: {
        deprecated: true,
        deprecatedAt: new Date().toISOString(),
        reason: 'No longer used',
      },
    })

    await permissionsRepository.create(normalPermission)
    await permissionsRepository.create(deprecatedPermission)

    // Executa o use case
    const result = await sut.execute()

    // Verifica permissões
    const coreModule = result.permissions.find((m) => m.module === 'CORE')
    const permissions = coreModule?.resources.users.permissions

    const normalPerm = permissions?.find((p) => p.action === 'read')
    const deprecatedPerm = permissions?.find((p) => p.action === 'delete')

    expect(normalPerm?.isDeprecated).toBe(false)
    expect(deprecatedPerm?.isDeprecated).toBe(true)
  })

  it('should sort permissions by action within each resource', async () => {
    // Cria permissões em ordem não alfabética
    await permissionsRepository.create(
      Permission.create({
        code: PermissionCode.create('core.users.update'),
        name: 'Update Users',
        description: 'Update users',
        module: 'core',
        resource: 'users',
        action: 'update',
        isSystem: true,
        metadata: {},
      }),
    )

    await permissionsRepository.create(
      Permission.create({
        code: PermissionCode.create('core.users.create'),
        name: 'Create Users',
        description: 'Create users',
        module: 'core',
        resource: 'users',
        action: 'create',
        isSystem: true,
        metadata: {},
      }),
    )

    await permissionsRepository.create(
      Permission.create({
        code: PermissionCode.create('core.users.delete'),
        name: 'Delete Users',
        description: 'Delete users',
        module: 'core',
        resource: 'users',
        action: 'delete',
        isSystem: true,
        metadata: {},
      }),
    )

    await permissionsRepository.create(
      Permission.create({
        code: PermissionCode.create('core.users.read'),
        name: 'Read Users',
        description: 'Read users',
        module: 'core',
        resource: 'users',
        action: 'read',
        isSystem: true,
        metadata: {},
      }),
    )

    // Executa o use case
    const result = await sut.execute()

    // Verifica ordenação
    const coreModule = result.permissions.find((m) => m.module === 'CORE')
    const permissions = coreModule?.resources.users.permissions
    const actions = permissions?.map((p) => p.action)

    expect(actions).toEqual(['create', 'delete', 'read', 'update'])
  })

  it('should return empty array if no permissions exist', async () => {
    const result = await sut.execute()

    expect(result.permissions).toEqual([])
    expect(result.total).toBe(0)
    expect(result.modules).toEqual([])
  })

  it('should group multiple resources in the same module', async () => {
    // Cria permissões para múltiplos recursos no mesmo módulo
    await permissionsRepository.create(
      Permission.create({
        code: PermissionCode.create('core.users.read'),
        name: 'Read Users',
        description: 'Read users',
        module: 'core',
        resource: 'users',
        action: 'read',
        isSystem: true,
        metadata: {},
      }),
    )

    await permissionsRepository.create(
      Permission.create({
        code: PermissionCode.create('core.sessions.read'),
        name: 'Read Sessions',
        description: 'Read sessions',
        module: 'core',
        resource: 'sessions',
        action: 'read',
        isSystem: true,
        metadata: {},
      }),
    )

    await permissionsRepository.create(
      Permission.create({
        code: PermissionCode.create('core.profiles.read'),
        name: 'Read Profiles',
        description: 'Read profiles',
        module: 'core',
        resource: 'profiles',
        action: 'read',
        isSystem: true,
        metadata: {},
      }),
    )

    // Executa o use case
    const result = await sut.execute()

    // Validações
    expect(result.modules).toHaveLength(1)
    expect(result.modules).toContain('CORE')

    const coreModule = result.permissions.find((m) => m.module === 'CORE')
    expect(Object.keys(coreModule?.resources || {})).toHaveLength(3)
    expect(coreModule?.resources.users).toBeDefined()
    expect(coreModule?.resources.sessions).toBeDefined()
    expect(coreModule?.resources.profiles).toBeDefined()
  })

  it('should include permission details correctly', async () => {
    const permission = Permission.create({
      code: PermissionCode.create('core.users.read'),
      name: 'Read Users',
      description: 'Read users',
      module: 'core',
      resource: 'users',
      action: 'read',
      isSystem: true,
      metadata: {},
    })

    await permissionsRepository.create(permission)

    const result = await sut.execute()

    const coreModule = result.permissions.find((m) => m.module === 'CORE')
    const perm = coreModule?.resources.users.permissions[0]

    expect(perm?.id).toBeDefined()
    expect(perm?.code).toBe('core.users.read')
    expect(perm?.name).toBe('Read Users')
    expect(perm?.action).toBe('read')
    expect(perm?.isDeprecated).toBe(false)
  })
})
