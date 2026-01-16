import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Manufacturers (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list manufacturers with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    await prisma.manufacturer.create({
      data: {
        name: `Manufacturer ${timestamp}`,
        country: 'United States',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get('/v1/manufacturers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('manufacturers');
    expect(Array.isArray(response.body.manufacturers)).toBe(true);
  });
});
