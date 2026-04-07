import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('Validate Bulk Variants (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should validate and return correct response shape', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template ValidateVariants ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create a product so it appears as "existing"
    const { product: existingProduct } = await createProduct({
      tenantId,
      name: `Existing Product ${timestamp}`,
      templateId: template.id,
    });

    const response = await request(app.server)
      .post('/v1/variants/bulk/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productNames: [
          existingProduct.name,
          `NonExistent Product ${timestamp}`,
        ],
        templateId: template.id,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('existingProducts');
    expect(response.body).toHaveProperty('missingProducts');
    expect(response.body).toHaveProperty('templateValid', true);
    expect(response.body.existingProducts).toHaveLength(1);
    expect(response.body.existingProducts[0]).toHaveProperty(
      'name',
      existingProduct.name,
    );
    expect(response.body.existingProducts[0]).toHaveProperty('id');
    expect(response.body.missingProducts).toContain(
      `NonExistent Product ${timestamp}`,
    );
  });
});
