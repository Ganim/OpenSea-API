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

  it('should allow ADMIN to CREATE a permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
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
        metadata: {
          category: 'testing',
        },
      });

    if (response.statusCode !== 201) {
      console.log('Error response:', response.body);
    }

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      permission: expect.objectContaining({
        id: expect.any(String),
        code: `test.${resource}.create`,
        name: 'Create Test Resource',
        description: 'Permission to create test resources',
        module: 'test',
        resource,
        action: 'create',
        isSystem: false,
        metadata: {
          category: 'testing',
        },
        createdAt: expect.any(String),
      }),
    });
  });

  it('should NOT allow USER to CREATE a permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const uniqueId = faker.string.alpha({ length: 8 }).toLowerCase();
    const resource = `resource-${uniqueId}`;

    const response = await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `test.${resource}.read`,
        name: 'Read Test Resource',
        description: 'Permission to read test resources',
        module: 'test',
        resource,
        action: 'read',
      });

    expect(response.statusCode).toEqual(403);
  });

  it('should NOT allow unauthenticated request', async () => {
    const uniqueId = faker.string.alpha({ length: 8 }).toLowerCase();
    const resource = `resource-${uniqueId}`;

    const response = await request(app.server)
      .post('/v1/rbac/permissions')
      .send({
        code: `test.${resource}.update`,
        name: 'Update Test Resource',
        module: 'test',
        resource,
        action: 'update',
      });

    expect(response.statusCode).toEqual(401);
  });

  it('should REJECT invalid permission code format', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'invalid-code',
        name: 'Invalid Permission',
        description: 'This should fail',
        module: 'invalid',
        resource: 'code',
        action: 'test',
      });

    expect(response.statusCode).toEqual(400);
  });

  it('should REJECT duplicate permission code', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const uniqueId = faker.string.alpha({ length: 8 }).toLowerCase();
    const resource = `duplicate-${uniqueId}`;

    const permissionData = {
      code: `test.${resource}.create`,
      name: 'Duplicate Test',
      description: 'Testing duplicate codes',
      module: 'test',
      resource,
      action: 'create',
    };

    // Create first permission
    const firstResponse = await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send(permissionData);

    if (firstResponse.statusCode !== 201) {
      console.log('First creation failed:', firstResponse.body);
    }

    // Try to create duplicate
    const response = await request(app.server)
      .post('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send(permissionData);

    expect(response.statusCode).toEqual(400);
    expect(response.body.message).toContain('already exists');
  });
});
