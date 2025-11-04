import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Customer (E2E)', () => {
  let userToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    userToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a customer', async () => {
    const timestamp = Date.now();

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: `Customer Update ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/customers/${customer.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Updated Customer ${timestamp}`,
        email: `updated${timestamp}@example.com`,
        phone: '(11) 99999-9999',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      customer: {
        id: customer.id,
        name: `Updated Customer ${timestamp}`,
        email: `updated${timestamp}@example.com`,
        phone: '(11) 99999-9999',
      },
    });
  });

  it('should be able to deactivate a customer', async () => {
    const timestamp = Date.now();

    const customer = await prisma.customer.create({
      data: {
        name: `Customer Deactivate ${timestamp}`,
        type: 'BUSINESS',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/customers/${customer.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.customer.isActive).toBe(false);
  });

  it('should not be able to update a customer without authentication', async () => {
    const timestamp = Date.now();

    const customer = await prisma.customer.create({
      data: {
        name: `Customer Unauthenticated ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/customers/${customer.id}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(401);
  });

  it('should return 404 when updating non-existent customer', async () => {
    const response = await request(app.server)
      .put('/v1/customers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(404);
  });
});
