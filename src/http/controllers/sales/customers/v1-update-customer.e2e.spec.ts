import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Customer (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update customer with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const tenant = await prisma.tenant.create({
      data: {
        name: `Tenant Update Customer ${timestamp}`,
        slug: `tenant-update-customer-${timestamp}`,
        status: 'ACTIVE',
      },
    });
    const tenantId = tenant.id;

    const customer = await prisma.customer.create({
      data: {
        name: `Customer Update ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
        tenantId,
      },
    });

    const response = await request(app.server)
      .put(`/v1/customers/${customer.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Customer ${timestamp}`,
        email: `updated${timestamp}@example.com`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customer');
    expect(response.body.customer).toHaveProperty(
      'name',
      `Updated Customer ${timestamp}`,
    );
  });
});
