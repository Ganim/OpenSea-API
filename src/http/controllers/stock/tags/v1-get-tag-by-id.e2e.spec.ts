import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Tag By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a tag by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create a tag first
    const createResponse = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Get Test Tag ${Date.now()}`,
        slug: `get-test-tag-${Date.now()}`,
        color: '#00FF00',
        description: 'Tag for get test',
      });

    expect(createResponse.status).toBe(201);
    const tagId = createResponse.body.tag.id;

    // Get the tag by ID
    const response = await request(app.server)
      .get(`/v1/tags/${tagId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.tag).toEqual(
      expect.objectContaining({
        id: tagId,
        name: expect.any(String),
        slug: expect.any(String),
        color: '#00FF00',
        description: 'Tag for get test',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should not be able to get a non-existing tag', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/tags/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Tag not found');
  });

  it('should not be able to get a tag without authentication', async () => {
    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).get(`/v1/tags/${nonExistingId}`);

    expect(response.status).toBe(401);
  });
});
