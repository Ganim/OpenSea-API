import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('List Product Care Instructions (E2E)', () => {
  let tenantId: string;
  let careTemplateId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Care Template ${Date.now()}`,
        code: String(Date.now()).slice(-3),
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
        specialModules: ['CARE_INSTRUCTIONS'],
      },
    });
    careTemplateId = template.id;
  });

  it('should list care instructions for a product', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({
      tenantId,
      templateId: careTemplateId,
    });

    // Create 2 care instructions
    await request(app.server)
      .post(`/v1/products/${product.id}/care-instructions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        careInstructionId: 'DO_NOT_BLEACH',
        order: 0,
      });

    await request(app.server)
      .post(`/v1/products/${product.id}/care-instructions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        careInstructionId: 'DO_NOT_IRON',
        order: 1,
      });

    const response = await request(app.server)
      .get(`/v1/products/${product.id}/care-instructions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.productCareInstructions).toHaveLength(2);
    expect(response.body.productCareInstructions[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        productId: product.id,
        careInstructionId: expect.any(String),
        order: expect.any(Number),
      }),
    );
  });

  it('should return empty array when product has no care instructions', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({
      tenantId,
      templateId: careTemplateId,
    });

    const response = await request(app.server)
      .get(`/v1/products/${product.id}/care-instructions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.productCareInstructions).toEqual([]);
  });
});
