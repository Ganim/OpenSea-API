import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('Delete Product Care Instruction (E2E)', () => {
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


  it('should delete a care instruction from a product', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({
      tenantId,
      templateId: careTemplateId,
    });

    // Create a care instruction first
    const createResponse = await request(app.server)
      .post(`/v1/products/${product.id}/care-instructions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        careInstructionId: 'BLEACH_ALLOWED',
        order: 0,
      });

    expect(createResponse.status).toBe(201);
    const careInstructionDbId = createResponse.body.productCareInstruction.id;

    // Delete it
    const deleteResponse = await request(app.server)
      .delete(
        `/v1/products/${product.id}/care-instructions/${careInstructionDbId}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });

  it('should return 404 when care instruction does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({
      tenantId,
      templateId: careTemplateId,
    });

    const response = await request(app.server)
      .delete(
        `/v1/products/${product.id}/care-instructions/00000000-0000-0000-0000-000000000000`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
