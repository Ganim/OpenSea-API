import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

describe('Update Variant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update variant with correct schema', async () => {
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
        name: `Update Variant Template ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      tenantId,
      name: `Product For Update ${timestamp}`,
      templateId: template.id,
    });

    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
      sku: `SKU-UPDATE-${timestamp}`,
      name: `Old Variant Name ${timestamp}`,
      price: 99.99,
    });

    const response = await request(app.server)
      .put(`/v1/variants/${variant.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Variant Name ${timestamp}`,
        price: 109.99,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('variant');
    expect(response.body.variant).toHaveProperty('id', variant.id);
    expect(response.body.variant).toHaveProperty(
      'name',
      `Updated Variant Name ${timestamp}`,
    );
  });
});
