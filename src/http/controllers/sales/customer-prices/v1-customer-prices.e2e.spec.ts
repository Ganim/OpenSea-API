import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Customer Prices (E2E)', () => {
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

    // Create a customer for price association
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: `Customer E2E ${Date.now()}`,
        type: 'BUSINESS',
      },
    });
    customerId = customer.id;

    // Create a template, product and variant for price association
    const unique = Date.now().toString();
    const suffix = unique.slice(-4);

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template E2E ${unique}`,
        code: `TPL${suffix}`,
      },
    });

    const product = await prisma.product.create({
      data: {
        tenantId,
        name: `Product E2E ${unique}`,
        slug: `product-e2e-${unique}`,
        fullCode: `001.000.${suffix}`,
        barcode: `BCCP${suffix}`,
        eanCode: `EAN${suffix}CP000`,
        upcCode: `UPC${suffix}CP00`,
        status: 'ACTIVE',
        attributes: {},
        templateId: template.id,
      },
    });

    const variant = await prisma.variant.create({
      data: {
        tenantId,
        productId: product.id,
        name: 'Default',
        sku: `SKU-E2E-${unique}`,
        slug: `variant-e2e-${unique}`,
        fullCode: `001.000.${suffix}.001`,
        sequentialCode: 1,
        barcode: `BCVC${suffix}`,
        eanCode: `EAN${suffix}VC000`,
        upcCode: `UPC${suffix}VC00`,
        price: 100,
        attributes: {},
      },
    });
    variantId = variant.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/customer-prices should create a customer price (201)', async () => {
    const response = await request(app.server)
      .post('/v1/customer-prices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        variantId,
        price: 85.5,
        notes: 'Special negotiated price',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('customerPrice');
    expect(response.body.customerPrice).toHaveProperty('id');
    expect(response.body.customerPrice.customerId).toBe(customerId);
    expect(response.body.customerPrice.variantId).toBe(variantId);
    expect(response.body.customerPrice.price).toBe(85.5);
  });

  it('GET /v1/customer-prices should list customer prices (200)', async () => {
    const response = await request(app.server)
      .get('/v1/customer-prices')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customerPrices');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.customerPrices)).toBe(true);
  });

  it('PUT /v1/customer-prices/:id should update a customer price (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/customer-prices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        variantId,
        price: 90,
      });

    const customerPriceId = createResponse.body.customerPrice.id;

    const response = await request(app.server)
      .put(`/v1/customer-prices/${customerPriceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        price: 75,
        notes: 'Updated negotiated price',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customerPrice');
    expect(response.body.customerPrice.price).toBe(75);
    expect(response.body.customerPrice.notes).toBe('Updated negotiated price');
  });

  it('DELETE /v1/customer-prices/:id should delete a customer price (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/customer-prices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        variantId,
        price: 80,
      });

    const customerPriceId = createResponse.body.customerPrice.id;

    const response = await request(app.server)
      .delete(`/v1/customer-prices/${customerPriceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
