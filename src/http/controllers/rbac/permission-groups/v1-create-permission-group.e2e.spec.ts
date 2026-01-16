import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Permission Group (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create permission group with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const groupName = `Sales Team ${faker.string.uuid().slice(0, 8)}`;

    const response = await request(app.server)
      .post('/v1/rbac/permission-groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: groupName,
        description: 'Permissions for sales team members',
        color: '#FF5733',
        priority: 100,
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toHaveProperty('group');
    expect(response.body.group).toHaveProperty('id');
    expect(response.body.group).toHaveProperty('name', groupName);
  });
});
