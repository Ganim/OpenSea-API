import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('Create Variant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create variant with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const tenant = await prisma.tenant.create({
      data: {
        name: `tenant-${timestamp}`,
        slug: `tenant-${timestamp}`,
        status: 'ACTIVE',
      },
    });
    const tenantId = tenant.id;

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Variant Template ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      tenantId,
      name: `Product For Variant ${timestamp}`,
      templateId: template.id,
    });

    const response = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product.id,
        sku: `SKU-${timestamp}`,
        name: `Variant ${timestamp}`,
        price: 99.99,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('variant');
    expect(response.body.variant).toHaveProperty('id');
    expect(response.body.variant).toHaveProperty('sku');
    expect(response.body.variant).toHaveProperty('productId', product.id);
  });
});
