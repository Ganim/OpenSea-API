import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Requests (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list requests with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create a test request
    await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .get('/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('requests');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.requests)).toBe(true);
    expect(response.body.meta).toHaveProperty('page', 1);
    expect(response.body.meta).toHaveProperty('perPage');
    expect(response.body.meta).toHaveProperty('total');
  });
});
