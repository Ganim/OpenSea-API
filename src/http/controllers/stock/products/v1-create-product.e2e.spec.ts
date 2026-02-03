import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Product (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create product with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template CREATE Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-CREATE-${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('product');
    expect(response.body.product).toHaveProperty('id');
    expect(response.body.product).toHaveProperty('name');
    expect(response.body.product).toHaveProperty('fullCode');
  });
});
