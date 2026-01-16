import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Tag (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update tag with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Update Test Tag ${timestamp}`,
        color: '#FF0000',
      });

    const tagId = createResponse.body.tag.id;

    const response = await request(app.server)
      .put(`/v1/tags/${tagId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Tag ${timestamp}`,
        color: '#00FF00',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tag');
    expect(response.body.tag).toHaveProperty('id', tagId);
    expect(response.body.tag).toHaveProperty('color', '#00FF00');
  });
});
