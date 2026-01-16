import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Tags (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list tags with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `List Test Tag ${timestamp}`,
      });

    const response = await request(app.server)
      .get('/v1/tags')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tags');
    expect(Array.isArray(response.body.tags)).toBe(true);
  });
});
