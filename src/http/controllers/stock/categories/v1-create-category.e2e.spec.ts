import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Category (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create category with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Electronics ${timestamp}`,
        description: 'Electronic products',
        iconUrl: 'https://example.com/icons/electronics.svg',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('category');
    expect(response.body.category).toHaveProperty('id');
    expect(response.body.category).toHaveProperty('name');
    expect(response.body.category).toHaveProperty('slug');
    expect(response.body.category).toHaveProperty(
      'iconUrl',
      'https://example.com/icons/electronics.svg',
    );
  });
});
