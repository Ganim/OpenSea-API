import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Product By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get product by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();
    const suffix = String(timestamp).slice(-4);

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template Get Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: `Supplier Test ${timestamp}`,
        isActive: true,
      },
    });

    const manufacturer = await prisma.manufacturer.create({
      data: {
        tenantId,
        code: `M${suffix.slice(0, 2)}`,
        name: `Manufacturer Test ${timestamp}`,
        country: 'BR',
        isActive: true,
      },
    });

    const product = await prisma.product.create({
      data: {
        tenantId,
        fullCode: `001.M01.${suffix}`,
        slug: `product-to-get-${timestamp}`,
        barcode: `BCGET${suffix}`,
        eanCode: `EAN${suffix}GET00`,
        upcCode: `UPC${suffix}GET0`,
        name: 'Product to Get',
        status: 'ACTIVE',
        templateId: template.id,
        supplierId: supplier.id,
        manufacturerId: manufacturer.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        tenantId,
        productId: product.id,
        name: 'Variant Test',
        slug: `variant-test-${timestamp}`,
        fullCode: `001.M01.${suffix}.001`,
        sequentialCode: 1,
        barcode: `BCVAR${suffix}`,
        eanCode: `EAN${suffix}VAR00`,
        upcCode: `UPC${suffix}VAR0`,
        price: 100,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('product');
    expect(response.body.product).toHaveProperty('id', product.id);
    expect(response.body.product).toHaveProperty('name');
    // Validate relations are returned
    expect(response.body.product).toHaveProperty('template');
    expect(response.body.product.template).not.toBeNull();
    expect(response.body.product.template).toHaveProperty('id', template.id);
    expect(response.body.product.template).toHaveProperty('name');
    expect(response.body.product).toHaveProperty('supplier');
    expect(response.body.product.supplier).not.toBeNull();
    expect(response.body.product.supplier).toHaveProperty('id', supplier.id);
    expect(response.body.product).toHaveProperty('manufacturer');
    expect(response.body.product.manufacturer).not.toBeNull();
    expect(response.body.product.manufacturer).toHaveProperty(
      'id',
      manufacturer.id,
    );
    expect(response.body.product).toHaveProperty('variants');
    expect(Array.isArray(response.body.product.variants)).toBe(true);
    expect(response.body.product.variants?.length).toBe(1);
    expect(response.body.product.variants?.[0]).toHaveProperty(
      'id',
      variant.id,
    );
  });
});
