import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Tag (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a tag', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create a tag first
    const createResponse = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Update Test Tag ${Date.now()}`,
        color: '#FF0000',
        description: 'Original description',
      });

    expect(createResponse.status).toBe(201);
    const tagId = createResponse.body.tag.id;

    // Update the tag
    const response = await request(app.server)
      .put(`/v1/tags/${tagId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Tag ${Date.now()}`,
        color: '#00FF00',
        description: 'Updated description',
      });

    expect(response.status).toBe(200);
    expect(response.body.tag).toEqual(
      expect.objectContaining({
        id: tagId,
        name: expect.stringContaining('Updated Tag'),
        color: '#00FF00',
        description: 'Updated description',
      }),
    );
  });

  it('should not be able to update a non-existing tag', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/tags/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Tag not found');
  });

  it('should not be able to update tag with duplicate name', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create first tag
    await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Duplicate Name ${timestamp}`,
      });

    // Create second tag
    const createResponse = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Original Name ${timestamp}`,
      });

    const tagId = createResponse.body.tag.id;

    // Try to update second tag with first tag's name
    const response = await request(app.server)
      .put(`/v1/tags/${tagId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Duplicate Name ${timestamp}`,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'A tag with this name already exists',
    );
  });

  it('should not be able to update a tag without authentication', async () => {
    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/tags/${nonExistingId}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(401);
  });
});
