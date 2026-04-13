import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Customer Price (E2E)', () => {
  let tenantId: string;
  let token: string;
  let customerId: string;
  let variantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const customer = await prisma.customer.create({
      data: { tenantId, name: `CustPrice ${Date.now()}`, type: 'PF' },
    });
    customerId = customer.id;

    const product = await prisma.product.create({
      data: { tenantId, name: `ProdPrice ${Date.now()}`, type: 'SIMPLE' },
    });

    const variant = await prisma.variant.create({
      data: {
        tenantId,
        productId: product.id,
        sku: `SKU-CP-${Date.now()}`,
        price: 100,
      },
    });
    variantId = variant.id;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/customer-prices')
      .send({ customerId: 'x', variantId: 'y', price: 50 });

    expect(response.status).toBe(401);
  });

  it('should create a customer price (201)', async () => {
    const response = await request(app.server)
      .post('/v1/customer-prices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        variantId,
        price: 89.99,
        notes: 'Negotiated price for E2E test',
      });

    expect(response.status).toBe(201);
    expect(response.body.customerPrice).toBeDefined();
    expect(response.body.customerPrice).toHaveProperty('id');
  });
});
