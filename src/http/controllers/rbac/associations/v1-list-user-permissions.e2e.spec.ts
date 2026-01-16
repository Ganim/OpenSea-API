import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List User Permissions (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list user permissions with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('permissions');
    expect(Array.isArray(response.body.permissions)).toBe(true);
  });
});
