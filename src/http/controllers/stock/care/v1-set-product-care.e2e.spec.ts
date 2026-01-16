import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Set Product Care Instructions (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should set product care instructions with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `Template Care Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Product Care Test ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${product.id}/care`)
      .set('Authorization', `Bearer ${token}`)
      .send({ careInstructionIds: ['WASH_30', 'DO_NOT_BLEACH', 'IRON_150'] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('careInstructionIds');
    expect(response.body).toHaveProperty('careInstructions');
    expect(Array.isArray(response.body.careInstructions)).toBe(true);
  });
});
