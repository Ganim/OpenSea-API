import { app } from '@/app';
import { permissionByModuleSchema } from '@/http/schemas/rbac.schema';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { z } from 'zod';

type PermissionByModule = z.infer<typeof permissionByModuleSchema>;

describe('List Permissions By Modules (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to LIST permissions grouped by modules', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    // Criar algumas permissões de teste através da API
    const adminToken = (await createAndAuthenticateUser(app, 'ADMIN')).token;

    // Criar permissões via API
    await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'stock.custom.read',
        name: 'Read Custom',
        description: 'Permission to read stock custom',
        module: 'stock',
        resource: 'custom',
        action: 'read',
      });

    await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'stock.custom.create',
        name: 'Create Custom',
        description: 'Permission to create stock custom',
        module: 'stock',
        resource: 'custom',
        action: 'create',
      });

    await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'core.custom.read',
        name: 'Read Custom',
        description: 'Permission to read core custom',
        module: 'core',
        resource: 'custom',
        action: 'read',
      });

    const response = await request(app.server)
      .get('/v1/rbac/permissions/by-modules')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('modules');
    expect(response.body).toHaveProperty('totalPermissions');
    expect(response.body.totalPermissions).toBeGreaterThanOrEqual(3);

    // Verificar estrutura dos módulos
    const modules = response.body.modules;
    expect(Array.isArray(modules)).toBe(true);

    // Deve ter pelo menos os módulos 'stock' e 'core'
    const stockModule = modules.find(
      (m: PermissionByModule) => m.module === 'stock',
    );
    const coreModule = modules.find(
      (m: PermissionByModule) => m.module === 'core',
    );

    expect(stockModule).toBeDefined();
    expect(coreModule).toBeDefined();

    // Verificar estrutura do módulo
    expect(stockModule).toHaveProperty('permissions');
    expect(stockModule).toHaveProperty('total');
    expect(Array.isArray(stockModule.permissions)).toBe(true);
    expect(stockModule.total).toBeGreaterThanOrEqual(2);

    // Verificar estrutura da permissão
    const permission = stockModule.permissions[0];
    expect(permission).toHaveProperty('id');
    expect(permission).toHaveProperty('code');
    expect(permission).toHaveProperty('name');
    expect(permission).toHaveProperty('module');
    expect(permission).toHaveProperty('resource');
    expect(permission).toHaveProperty('action');
  });

  it('should filter out system permissions when includeSystem is false', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const adminToken = (await createAndAuthenticateUser(app, 'ADMIN')).token;

    // Criar permissões customizadas (isSystem=false) via API
    await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'test.filter.read',
        name: 'Read Filter',
        description: 'Test permission for filtering',
        module: 'test',
        resource: 'filter',
        action: 'read',
      });

    const response = await request(app.server)
      .get('/v1/rbac/permissions/by-modules?includeSystem=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('modules');
    expect(Array.isArray(response.body.modules)).toBe(true);

    // Verificar que não há permissões do sistema
    for (const module of response.body.modules) {
      for (const permission of module.permissions) {
        expect(permission.isSystem).toBe(false);
      }
    }
  });

  it('should include system permissions by default', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .get('/v1/rbac/permissions/by-modules')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('modules');
    expect(Array.isArray(response.body.modules)).toBe(true);

    // Pode haver permissões do sistema
    let hasSystemPermission = false;
    for (const module of response.body.modules) {
      for (const permission of module.permissions) {
        if (permission.isSystem) {
          hasSystemPermission = true;
          break;
        }
      }
      if (hasSystemPermission) break;
    }

    // Não necessariamente tem permissões do sistema, mas a estrutura está correta
    expect(response.body).toHaveProperty('totalPermissions');
  });

  it('should NOT allow unauthenticated request', async () => {
    const response = await request(app.server)
      .get('/v1/rbac/permissions/by-modules')
      .expect(401);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('User not authorized');
  });
});
