import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Tags (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list all tags', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create some tags first
    await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `List Test Tag 1 ${Date.now()}`,
        color: '#FF0000',
      });

    await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `List Test Tag 2 ${Date.now()}`,
        color: '#00FF00',
      });

    // List all tags
    const response = await request(app.server)
      .get('/v1/tags')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.tags).toBeInstanceOf(Array);
    expect(response.body.tags.length).toBeGreaterThanOrEqual(2);
    expect(response.body.tags[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        slug: expect.any(String),
        color: expect.anything(),
        description: expect.anything(),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should not be able to list tags without authentication', async () => {
    const response = await request(app.server).get('/v1/tags');

    expect(response.status).toBe(401);
  });
});
