import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Tag (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a tag with all fields', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Featured Products ${timestamp}`,
        slug: `featured-products-${timestamp}`,
        color: '#FF5733',
        description: 'Products that are featured on the homepage',
      });

    expect(response.status).toBe(201);
    expect(response.body.tag).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: `Featured Products ${timestamp}`,
        slug: `featured-products-${timestamp}`,
        color: '#FF5733',
        description: 'Products that are featured on the homepage',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should be able to create a tag with minimal data (auto-generate slug)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Sale Items ${timestamp}`,
      });

    expect(response.status).toBe(201);
    expect(response.body.tag).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: `Sale Items ${timestamp}`,
        slug: `sale-items-${timestamp}`,
        color: null,
        description: null,
      }),
    );
  });

  it('should not be able to create a tag with duplicate name', async () => {
    const timestamp = Date.now();
    const tagName = `Duplicate Tag ${timestamp}`;

    await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: tagName,
      });

    const response = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: tagName,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('A tag with this name already exists');
  });

  it('should not be able to create a tag with invalid color format', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Invalid Color Tag ${timestamp}`,
        color: 'red', // Invalid: must be hex format like #FF5733
      });

    // Zod schema validation rejects invalid format before reaching use case
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('color');
  });

  it('should not be able to create a tag without authentication', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/tags')
      .send({
        name: `Unauthorized Tag ${timestamp}`,
      });

    expect(response.status).toBe(401);
  });
});
