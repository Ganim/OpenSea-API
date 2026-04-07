import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('Bulk Create Variants (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should bulk create variants with auth', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template BulkVariants ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      tenantId,
      name: `Product BulkVariants ${timestamp}`,
      templateId: template.id,
    });

    const response = await request(app.server)
      .post('/v1/variants/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variants: [
          {
            name: `Bulk Variant A ${timestamp}`,
            productId: product.id,
          },
          {
            name: `Bulk Variant B ${timestamp}`,
            productId: product.id,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('created');
    expect(response.body.created).toHaveLength(2);
    expect(response.body.created[0]).toHaveProperty('id');
    expect(response.body.created[0]).toHaveProperty('name');
    expect(response.body.created[0]).toHaveProperty('fullCode');
  });

  it('should skip duplicate variants', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template BulkDupVariants ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      tenantId,
      name: `Product BulkDupVariants ${timestamp}`,
      templateId: template.id,
    });

    // Create an existing variant via the API
    const existingVariantName = `Existing Variant ${timestamp}`;
    await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: existingVariantName,
        productId: product.id,
      });

    const response = await request(app.server)
      .post('/v1/variants/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variants: [
          {
            name: existingVariantName,
            productId: product.id,
          },
          {
            name: `New Variant ${timestamp}`,
            productId: product.id,
          },
        ],
        options: {
          skipDuplicates: true,
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.skipped).toHaveLength(1);
    expect(response.body.skipped[0].name).toBe(existingVariantName);
    expect(response.body.created).toHaveLength(1);
    expect(response.body.created[0].name).toContain('New Variant');
  });

  it('should return 403 when user has register but not import permission', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template VarPerm ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productRes = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Product VarPerm ${timestamp}`,
        templateId: template.id,
      });

    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['stock.variants.register', 'stock.variants.access'],
    });

    const response = await request(app.server)
      .post('/v1/variants/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variants: [
          {
            name: `Variant PermTest ${timestamp}`,
            productId: productRes.body.product.id,
          },
        ],
      });

    expect(response.status).toBe(403);
  });

  it('should return 201 when user has import permission', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template VarImport ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productRes = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Product VarImport ${timestamp}`,
        templateId: template.id,
      });

    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['stock.variants.import'],
    });

    const response = await request(app.server)
      .post('/v1/variants/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variants: [
          {
            name: `Variant Import ${timestamp}`,
            productId: productRes.body.product.id,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.created).toHaveLength(1);
  });

  it('should return 400 with invalid payload', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/variants/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variants: [],
      });

    expect(response.status).toBe(400);
  });
});
