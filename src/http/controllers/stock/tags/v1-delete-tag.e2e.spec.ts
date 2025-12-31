import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Tag (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a tag', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a tag first
    const createResponse = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Delete Test Tag ${Date.now()}`,
      });

    expect(createResponse.status).toBe(201);
    const tagId = createResponse.body.tag.id;

    // Delete the tag
    const response = await request(app.server)
      .delete(`/v1/tags/${tagId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Verify tag was soft deleted (should not appear in list)
    const listResponse = await request(app.server)
      .get('/v1/tags')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.body.tags).not.toContainEqual(
      expect.objectContaining({ id: tagId }),
    );
  });

  it('should not be able to delete a non-existing tag', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/tags/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Tag not found');
  });

  it('should not be able to delete a tag without authentication', async () => {
    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).delete(
      `/v1/tags/${nonExistingId}`,
    );

    expect(response.status).toBe(401);
  });
});
