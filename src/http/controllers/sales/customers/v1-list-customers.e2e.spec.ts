import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Customers (E2E)', () => {
  let userToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'USER');
    userToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list customers with pagination', async () => {
    const timestamp = Date.now();

    // Create customers
    await prisma.customer.create({
      data: {
        name: `Customer List 1 ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
      },
    });

    await prisma.customer.create({
      data: {
        name: `Customer List 2 ${timestamp}`,
        type: 'BUSINESS',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get('/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ page: 1, perPage: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customers');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('perPage');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.customers)).toBe(true);
    expect(response.body.customers.length).toBeGreaterThanOrEqual(2);
  });

  it('should be able to filter customers by type', async () => {
    const timestamp = Date.now();

    await prisma.customer.create({
      data: {
        name: `Individual Customer ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get('/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ type: 'INDIVIDUAL' });

    expect(response.status).toBe(200);
    expect(
      response.body.customers.every(
        (c: { type: string }) => c.type === 'INDIVIDUAL',
      ),
    ).toBe(true);
  });

  it('should be able to filter customers by isActive', async () => {
    const timestamp = Date.now();

    await prisma.customer.create({
      data: {
        name: `Active Customer ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get('/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ isActive: true });

    expect(response.status).toBe(200);
    expect(
      response.body.customers.every(
        (c: { isActive: boolean }) => c.isActive === true,
      ),
    ).toBe(true);
  });

  it('should not be able to list customers without authentication', async () => {
    const response = await request(app.server).get('/v1/customers');

    expect(response.status).toBe(401);
  });
});
