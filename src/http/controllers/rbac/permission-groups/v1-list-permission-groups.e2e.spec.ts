import { app } from '@/app';
import { permissionGroupWithDetailsSchema } from '@/http/schemas/rbac.schema';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { z } from 'zod';

type PermissionGroupResponse = z.infer<typeof permissionGroupWithDetailsSchema>;

describe('List Permission Groups (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to LIST groups', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const uniqueSuffix = faker.string.alpha({ length: 6 }).toLowerCase();
    await makePermissionGroup({ name: `Test Group 1 ${uniqueSuffix}` });
    await makePermissionGroup({ name: `Test Group 2 ${uniqueSuffix}` });

    const response = await request(app.server)
      .get('/v1/rbac/permission-groups')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      groups: expect.any(Array),
      total: expect.any(Number),
      totalPages: expect.any(Number),
      page: expect.any(Number),
      limit: expect.any(Number),
    });
    expect(response.body.groups.length).toBeGreaterThan(0);
  });

  it('should return groups WITH usersCount and permissionsCount', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/rbac/permission-groups')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.groups.length).toBeGreaterThan(0);

    // Validar que cada grupo tem a estrutura completa
    response.body.groups.forEach((group: PermissionGroupResponse) => {
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('slug');
      expect(group).toHaveProperty('description');
      expect(group).toHaveProperty('color');
      expect(group).toHaveProperty('priority');
      expect(group).toHaveProperty('isActive');
      expect(group).toHaveProperty('isSystem');
      expect(group).toHaveProperty('parentId');
      expect(group).toHaveProperty('createdAt');
      expect(group).toHaveProperty('updatedAt');
      expect(group).toHaveProperty('deletedAt');
      expect(group).toHaveProperty('users');
      expect(group).toHaveProperty('usersCount');
      expect(group).toHaveProperty('permissions');
      expect(group).toHaveProperty('permissionsCount');

      // Validar tipos
      expect(typeof group.usersCount).toBe('number');
      expect(typeof group.permissionsCount).toBe('number');
      expect(Array.isArray(group.users)).toBe(true);
      expect(Array.isArray(group.permissions)).toBe(true);

      // Validar que os contadores correspondem aos arrays
      expect(group.users.length).toBe(group.usersCount);
      expect(group.permissions.length).toBe(group.permissionsCount);
    });
  });

  it('should FILTER groups by isActive', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const uniqueSuffix = faker.string.alpha({ length: 6 }).toLowerCase();
    await makePermissionGroup({
      name: `Active Group ${uniqueSuffix}`,
      isActive: true,
    });
    await makePermissionGroup({
      name: `Inactive Group ${uniqueSuffix}`,
      isActive: false,
    });

    const response = await request(app.server)
      .get('/v1/rbac/permission-groups')
      .query({ isActive: true })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(
      response.body.groups.every(
        (g: PermissionGroupResponse) => g.isActive === true,
      ),
    ).toBe(true);
  });

  it('should FILTER groups by isSystem', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const uniqueSuffix = faker.string.alpha({ length: 6 }).toLowerCase();
    await makePermissionGroup({
      name: `System Group ${uniqueSuffix}`,
      isSystem: true,
    });

    const response = await request(app.server)
      .get('/v1/rbac/permission-groups')
      .query({ isSystem: true })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(
      response.body.groups.every(
        (g: PermissionGroupResponse) => g.isSystem === true,
      ),
    ).toBe(true);
  });

  it('should PAGINATE results', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/rbac/permission-groups')
      .query({ page: 1, limit: 5 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.groups.length).toBeLessThanOrEqual(5);
  });

  it('should NOT allow unauthenticated request', async () => {
    const response = await request(app.server).get(
      '/v1/rbac/permission-groups',
    );

    expect(response.statusCode).toEqual(401);
  });
});
