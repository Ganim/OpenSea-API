import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Permission (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create permission with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const uniqueId = faker.string.alpha({ length: 8 }).toLowerCase();
    const resource = `resource-${uniqueId}`;

    const response = await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `test.${resource}.create`,
        name: 'Create Test Resource',
        description: 'Permission to create test resources',
        module: 'test',
        resource,
        action: 'create',
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toHaveProperty('permission');
    expect(response.body.permission).toHaveProperty('id');
    expect(response.body.permission).toHaveProperty('code');
  });
});
