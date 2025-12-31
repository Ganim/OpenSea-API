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

  it('should allow ADMIN to CREATE a permission group', async () => {
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

    if (response.statusCode !== 201) {
      console.log('Error response:', response.body);
    }

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      group: expect.objectContaining({
        id: expect.any(String),
        name: groupName,
        description: 'Permissions for sales team members',
        color: '#FF5733',
        priority: 100,
        isSystem: false,
        isActive: true,
        createdAt: expect.any(String),
      }),
    });
  });

  it('should allow creating group WITHOUT optional fields', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const groupName = `Minimal Group ${faker.string.uuid().slice(0, 8)}`;

    const response = await request(app.server)
      .post('/v1/rbac/permission-groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: groupName,
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body.group.name).toBe(groupName);
  });

  it('should NOT allow user without permission to CREATE a permission group', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const response = await request(app.server)
      .post('/v1/rbac/permission-groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'User Group',
        description: 'Should fail',
      });

    expect(response.statusCode).toEqual(403);
  });

  it('should NOT allow unauthenticated request', async () => {
    const response = await request(app.server)
      .post('/v1/rbac/permission-groups')
      .send({
        name: 'Anonymous Group',
      });

    expect(response.statusCode).toEqual(401);
  });

  it('should REJECT duplicate group name', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const groupData = {
      name: 'Unique Group Name',
      description: 'Testing duplicates',
    };

    await request(app.server)
      .post('/v1/rbac/permission-groups')
      .set('Authorization', `Bearer ${token}`)
      .send(groupData);

    const response = await request(app.server)
      .post('/v1/rbac/permission-groups')
      .set('Authorization', `Bearer ${token}`)
      .send(groupData);

    expect(response.statusCode).toEqual(400);
    expect(response.body.message).toContain('already exists');
  });

  it('should validate COLOR format', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/rbac/permission-groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Invalid Color Group',
        color: 'not-a-valid-color',
      });

    expect(response.statusCode).toEqual(400);
  });
});
