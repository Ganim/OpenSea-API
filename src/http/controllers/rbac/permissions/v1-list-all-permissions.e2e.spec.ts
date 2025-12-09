import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e'
import { prisma } from '@/lib/prisma'

describe('List All Permissions (e2e)', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to list all permissions grouped by module', async () => {
    // Cria e autentica um usuário admin
    const { token } = await createAndAuthenticateUser(app, 'ADMIN')

    // Cria algumas permissões de teste
    await prisma.permission.createMany({
      data: [
        {
          code: 'test.resource1.read',
          name: 'Read Resource1',
          description: 'Read resource1',
          module: 'test',
          resource: 'resource1',
          action: 'read',
          isSystem: true,
        },
        {
          code: 'test.resource1.create',
          name: 'Create Resource1',
          description: 'Create resource1',
          module: 'test',
          resource: 'resource1',
          action: 'create',
          isSystem: true,
        },
        {
          code: 'test.resource2.read',
          name: 'Read Resource2',
          description: 'Read resource2',
          module: 'test',
          resource: 'resource2',
          action: 'read',
          isSystem: true,
        },
      ],
    })

    // Faz a requisição
    const response = await request(app.server)
      .get('/v1/rbac/permissions/all')
      .set('Authorization', `Bearer ${token}`)
      .send()

    // Validações
    expect(response.statusCode).toEqual(200)
    expect(response.body).toHaveProperty('permissions')
    expect(response.body).toHaveProperty('total')
    expect(response.body).toHaveProperty('modules')

    // Verifica estrutura dos dados
    expect(Array.isArray(response.body.permissions)).toBe(true)
    expect(Array.isArray(response.body.modules)).toBe(true)
    expect(typeof response.body.total).toBe('number')

    // Verifica se existe o módulo TEST
    const testModule = response.body.permissions.find(
      (m: { module: string }) => m.module === 'TEST',
    )
    expect(testModule).toBeDefined()
    expect(testModule.module).toBe('TEST')
    expect(testModule.description).toBeTruthy()
    expect(testModule.resources).toBeDefined()

    // Verifica se os recursos existem
    expect(testModule.resources.resource1).toBeDefined()
    expect(testModule.resources.resource2).toBeDefined()

    // Verifica se as permissões estão agrupadas corretamente
    expect(testModule.resources.resource1.permissions).toHaveLength(2)
    expect(testModule.resources.resource2.permissions).toHaveLength(1)

    // Verifica estrutura da permissão
    const permission = testModule.resources.resource1.permissions[0]
    expect(permission).toHaveProperty('id')
    expect(permission).toHaveProperty('code')
    expect(permission).toHaveProperty('name')
    expect(permission).toHaveProperty('action')
    expect(permission).toHaveProperty('isDeprecated')

    // Limpa os dados de teste
    await prisma.permission.deleteMany({
      where: {
        module: 'test',
      },
    })
  })

  it('should mark deprecated permissions correctly', async () => {
    // Cria e autentica um usuário admin
    const { token } = await createAndAuthenticateUser(app, 'ADMIN')

    // Cria uma permissão deprecated
    await prisma.permission.create({
      data: {
        code: 'test.deprecated.read',
        name: 'Read Deprecated',
        description: 'Read deprecated resource',
        module: 'test',
        resource: 'deprecated',
        action: 'read',
        isSystem: true,
        metadata: {
          deprecated: true,
          deprecatedAt: new Date().toISOString(),
          reason: 'No longer used',
        },
      },
    })

    // Faz a requisição
    const response = await request(app.server)
      .get('/v1/rbac/permissions/all')
      .set('Authorization', `Bearer ${token}`)
      .send()

    // Encontra a permissão deprecated
    const testModule = response.body.permissions.find(
      (m: { module: string }) => m.module === 'TEST',
    )
    expect(testModule).toBeDefined()

    const deprecatedResource = testModule.resources.deprecated
    expect(deprecatedResource).toBeDefined()
    expect(deprecatedResource.permissions).toHaveLength(1)

    const permission = deprecatedResource.permissions[0]
    expect(permission.isDeprecated).toBe(true)
    expect(permission.code).toBe('test.deprecated.read')

    // Limpa os dados de teste
    await prisma.permission.deleteMany({
      where: {
        module: 'test',
      },
    })
  })

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(app.server)
      .get('/v1/rbac/permissions/all')
      .send()

    expect(response.statusCode).toEqual(401)
  })

  it('should return permissions sorted by action within each resource', async () => {
    // Cria e autentica um usuário admin
    const { token } = await createAndAuthenticateUser(app, 'ADMIN')

    // Cria permissões em ordem não alfabética
    await prisma.permission.createMany({
      data: [
        {
          code: 'test.sorted.update',
          name: 'Update Sorted',
          description: 'Update',
          module: 'test',
          resource: 'sorted',
          action: 'update',
          isSystem: true,
        },
        {
          code: 'test.sorted.create',
          name: 'Create Sorted',
          description: 'Create',
          module: 'test',
          resource: 'sorted',
          action: 'create',
          isSystem: true,
        },
        {
          code: 'test.sorted.delete',
          name: 'Delete Sorted',
          description: 'Delete',
          module: 'test',
          resource: 'sorted',
          action: 'delete',
          isSystem: true,
        },
        {
          code: 'test.sorted.read',
          name: 'Read Sorted',
          description: 'Read',
          module: 'test',
          resource: 'sorted',
          action: 'read',
          isSystem: true,
        },
      ],
    })

    // Faz a requisição
    const response = await request(app.server)
      .get('/v1/rbac/permissions/all')
      .set('Authorization', `Bearer ${token}`)
      .send()

    // Encontra o módulo TEST
    const testModule = response.body.permissions.find(
      (m: { module: string }) => m.module === 'TEST',
    )

    const permissions = testModule.resources.sorted.permissions
    const actions = permissions.map((p: { action: string }) => p.action)

    // Verifica se está ordenado alfabeticamente
    expect(actions).toEqual(['create', 'delete', 'read', 'update'])

    // Limpa os dados de teste
    await prisma.permission.deleteMany({
      where: {
        module: 'test',
      },
    })
  })
})
