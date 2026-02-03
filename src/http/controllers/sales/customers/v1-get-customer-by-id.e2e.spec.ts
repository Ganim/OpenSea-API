import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Customer By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get customer by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const tenant = await prisma.tenant.create({
      data: {
        name: `Tenant Get Customer ${timestamp}`,
        slug: `tenant-get-customer-${timestamp}`,
        status: 'ACTIVE',
      },
    });
    const tenantId = tenant.id;

    const customer = await prisma.customer.create({
      data: {
        name: `Customer Get By ID ${timestamp}`,
        type: 'INDIVIDUAL',
        isActive: true,
        tenantId,
      },
    });

    const response = await request(app.server)
      .get(`/v1/customers/${customer.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customer');
    expect(response.body.customer).toHaveProperty('id', customer.id);
    expect(response.body.customer).toHaveProperty('name');
    expect(response.body.customer).toHaveProperty('type');
  });
});
