import { app } from '@/app';
import { permissionSchema } from '@/http/schemas/rbac.schema';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { z } from 'zod';

type PermissionResponse = z.infer<typeof permissionSchema>;

describe('List Permissions (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to LIST permissions', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    await makePermission({
      module: 'sales',
      resource: 'order',
      action: 'create',
    });
    await makePermission({
      module: 'sales',
      resource: 'order',
      action: 'read',
    });

    const response = await request(app.server)
      .get('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      permissions: expect.any(Array),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
    expect(response.body.permissions.length).toBeGreaterThan(0);
  });

  it('should FILTER permissions by MODULE', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    await makePermission({
      module: 'stock',
      resource: 'item',
      action: 'create',
    });
    await makePermission({ module: 'core', resource: 'user', action: 'read' });

    const response = await request(app.server)
      .get('/v1/rbac/permissions')
      .query({ module: 'stock' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(
      response.body.permissions.every(
        (p: PermissionResponse) => p.module === 'stock',
      ),
    ).toBe(true);
  });

  it('should FILTER permissions by RESOURCE', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    await makePermission({
      module: 'sales',
      resource: 'invoice',
      action: 'create',
    });
    await makePermission({
      module: 'sales',
      resource: 'invoice',
      action: 'read',
    });

    const response = await request(app.server)
      .get('/v1/rbac/permissions')
      .query({ resource: 'invoice' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(
      response.body.permissions.every(
        (p: PermissionResponse) => p.resource === 'invoice',
      ),
    ).toBe(true);
  });

  it('should FILTER permissions by ACTION', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    await makePermission({
      module: 'core',
      resource: 'profile',
      action: 'delete',
    });

    const response = await request(app.server)
      .get('/v1/rbac/permissions')
      .query({ action: 'delete' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(
      response.body.permissions.every(
        (p: PermissionResponse) => p.action === 'delete',
      ),
    ).toBe(true);
  });

  it('should PAGINATE results', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .get('/v1/rbac/permissions')
      .query({ page: 1, limit: 5 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions.length).toBeLessThanOrEqual(5);
  });

  it('should NOT allow unauthenticated request', async () => {
    const response = await request(app.server).get('/v1/rbac/permissions');

    expect(response.statusCode).toEqual(401);
  });
});
