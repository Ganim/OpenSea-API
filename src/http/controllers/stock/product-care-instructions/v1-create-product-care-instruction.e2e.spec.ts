import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('Create Product Care Instruction (E2E)', () => {
  let tenantId: string;
  let careTemplateId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    // Create a template with CARE_INSTRUCTIONS special module
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

  afterAll(async () => {
    await app.close();
  });

  it('should create a care instruction for a product', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({
      tenantId,
      templateId: careTemplateId,
    });

    const response = await request(app.server)
      .post(`/v1/products/${product.id}/care-instructions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        careInstructionId: 'DO_NOT_BLEACH',
        order: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body.productCareInstruction).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        productId: product.id,
        careInstructionId: 'DO_NOT_BLEACH',
        order: 1,
      }),
    );
  });

  it('should return 404 when product does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/products/00000000-0000-0000-0000-000000000000/care-instructions',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        careInstructionId: 'DO_NOT_BLEACH',
        order: 0,
      });

    expect(response.status).toBe(404);
  });

  it('should return 400 when careInstructionId is empty', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({
      tenantId,
      templateId: careTemplateId,
    });

    const response = await request(app.server)
      .post(`/v1/products/${product.id}/care-instructions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        careInstructionId: '',
        order: 0,
      });

    expect(response.status).toBe(400);
  });
});
