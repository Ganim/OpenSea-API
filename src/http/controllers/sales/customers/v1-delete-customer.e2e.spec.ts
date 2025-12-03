import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete Customer (E2E)', () => {
  let userToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    userToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a customer (soft delete)', async () => {
    const timestamp = Date.now();

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: `Customer Delete ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/customers/${customer.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: 'Customer deleted successfully.',
    });

    // Verify customer was soft deleted
    const deletedCustomer = await prisma.customer.findUnique({
      where: { id: customer.id },
    });

    expect(deletedCustomer?.deletedAt).not.toBeNull();
  });

  it('should not be able to delete a customer without authentication', async () => {
    const timestamp = Date.now();

    const customer = await prisma.customer.create({
      data: {
        name: `Customer Unauthenticated Delete ${timestamp}`,
        type: 'BUSINESS',
        isActive: true,
      },
    });

    const response = await request(app.server).delete(
      `/v1/customers/${customer.id}`,
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 when deleting non-existent customer', async () => {
    const response = await request(app.server)
      .delete('/v1/customers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });
});
