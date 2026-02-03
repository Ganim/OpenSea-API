import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Product (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update product with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();
    const suffix = String(timestamp).slice(-4);

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template Update Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        tenantId,
        fullCode: `001.000.${suffix}`,
        slug: `old-product-name-${timestamp}`,
        barcode: `BCUPD${suffix}`,
        eanCode: `EAN${suffix}UPD00`,
        upcCode: `UPC${suffix}UPD0`,
        name: `Old Product Name ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Product Name ${timestamp}`,
        status: 'INACTIVE',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('product');
    expect(response.body.product).toHaveProperty('id', product.id);
    expect(response.body.product).toHaveProperty(
      'name',
      `Updated Product Name ${timestamp}`,
    );
  });
});
