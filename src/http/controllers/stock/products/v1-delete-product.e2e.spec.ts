import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete Product (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete product with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();
    const suffix = String(timestamp).slice(-4);

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
        name: `Template Delete Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        tenantId,
        fullCode: `001.000.${suffix}`,
        slug: `product-to-delete-${timestamp}`,
        barcode: `BCDEL${suffix}`,
        eanCode: `EAN${suffix}DEL00`,
        upcCode: `UPC${suffix}DEL0`,
        name: 'Product to Delete',
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .delete(`/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
