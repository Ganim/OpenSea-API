import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Get Accountant Categories (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 without accountant token', async () => {
    const response = await request(app.server).get(
      '/v1/accountant/categories',
    );

    expect(response.status).toBe(401);
  });

  it('should return 401 with invalid accountant token', async () => {
    const response = await request(app.server)
      .get('/v1/accountant/categories')
      .set('Authorization', 'Bearer invalid-token-123');

    expect(response.status).toBe(401);
  });
});
