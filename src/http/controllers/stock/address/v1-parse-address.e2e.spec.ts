import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Parse Address (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should parse address with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/address/parse/FAB-EST-102-B')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('valid');
    expect(response.body).toHaveProperty('originalAddress', 'FAB-EST-102-B');
  });

  it('should not parse address without auth token', async () => {
    const response = await request(app.server).get(
      '/v1/address/parse/FAB-EST-102-B',
    );

    expect(response.status).toBe(401);
  });
});
