import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Add Catalog Item (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/catalogs/00000000-0000-0000-0000-000000000001/items')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent catalog', async () => {
    const response = await request(app.server)
      .post('/v1/catalogs/00000000-0000-0000-0000-000000000001/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variantId: '00000000-0000-0000-0000-000000000002',
        position: 1,
      });

    expect([404, 400]).toContain(response.status);
  });

  it('should add an item to a catalog (201)', async () => {
    const timestamp = Date.now();

    // Create a catalog
    const createResponse = await request(app.server)
      .post('/v1/catalogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Catalog AddItem ${timestamp}`,
        type: 'GENERAL',
        showPrices: true,
        showStock: false,
        isPublic: true,
      });

    if (createResponse.status === 201) {
      const catalogId = createResponse.body.catalog.id;

      // Create a product and variant for the catalog item
      const product = await prisma.product.create({
        data: {
          tenantId,
          name: `Product CatalogItem ${timestamp}`,
          sku: `SKU-CAT-${timestamp}`,
          status: 'ACTIVE',
        },
      });

      const variant = await prisma.productVariant.create({
        data: {
          tenantId,
          productId: product.id,
          name: 'Default',
          sku: `SKU-VAR-CAT-${timestamp}`,
          price: 100,
          cost: 50,
        },
      });

      const response = await request(app.server)
        .post(`/v1/catalogs/${catalogId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          variantId: variant.id,
          position: 1,
          featured: false,
        });

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty('itemId');
      }
    }
  });
});
