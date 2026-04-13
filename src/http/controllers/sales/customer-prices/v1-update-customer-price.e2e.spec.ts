import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Customer Price (E2E)', () => {
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
      data: { tenantId, name: `CustPriceUpd ${Date.now()}`, type: 'PJ' },
    });
    customerId = customer.id;

    const product = await prisma.product.create({
      data: { tenantId, name: `ProdPriceUpd ${Date.now()}`, type: 'SIMPLE' },
    });

    const variant = await prisma.variant.create({
      data: {
        tenantId,
        productId: product.id,
        sku: `SKU-UCP-${Date.now()}`,
        price: 200,
      },
    });
    variantId = variant.id;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/customer-prices/00000000-0000-0000-0000-000000000001')
      .send({ price: 75 });

    expect(response.status).toBe(401);
  });

  it('should update a customer price (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/customer-prices')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId, variantId, price: 100 });

    const priceId = createRes.body.customerPrice.id;

    const response = await request(app.server)
      .put(`/v1/customer-prices/${priceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 75 });

    expect(response.status).toBe(200);
    expect(response.body.customerPrice).toBeDefined();
  });
});
