import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Supplier By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get supplier by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: `Test Supplier ${timestamp}`,
        city: 'São Paulo',
        state: 'SP',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('supplier');
    expect(response.body.supplier).toHaveProperty('id', supplier.id);
    expect(response.body.supplier).toHaveProperty('name');
  });
});
