import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Customer By ID (E2E)', () => {
  let userToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'USER');
    userToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a customer by id', async () => {
    const timestamp = Date.now();

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: `Customer Get By ID ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/customers/${customer.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      customer: {
        id: customer.id,
        name: `Customer Get By ID ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
      },
    });
  });

  it('should not be able to get a customer without authentication', async () => {
    const timestamp = Date.now();

    const customer = await prisma.customer.create({
      data: {
        name: `Customer Unauthenticated ${timestamp}`,
        type: 'BUSINESS',
        isActive: true,
      },
    });

    const response = await request(app.server).get(
      `/v1/customers/${customer.id}`,
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent customer', async () => {
    const response = await request(app.server)
      .get('/v1/customers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });
});
