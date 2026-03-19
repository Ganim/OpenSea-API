import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Bulk Create Products (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should bulk create products with auth', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template BulkCreate ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/products/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        products: [
          {
            name: `Bulk Product A ${timestamp}`,
            templateId: template.id,
          },
          {
            name: `Bulk Product B ${timestamp}`,
            templateId: template.id,
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

  it('should skip duplicate products', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template BulkDup ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create an existing product via the API so all required fields are generated
    const existingProductName = `Existing Product ${timestamp}`;
    await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: existingProductName,
        templateId: template.id,
      });

    const response = await request(app.server)
      .post('/v1/products/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        products: [
          {
            name: existingProductName,
            templateId: template.id,
          },
          {
            name: `New Product ${timestamp}`,
            templateId: template.id,
          },
        ],
        options: {
          skipDuplicates: true,
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.skipped).toHaveLength(1);
    expect(response.body.skipped[0].name).toBe(existingProductName);
    expect(response.body.created).toHaveLength(1);
    expect(response.body.created[0].name).toContain('New Product');
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/products/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        products: [
          {
            name: `No Permission Product ${timestamp}`,
            templateId: '00000000-0000-0000-0000-000000000000',
          },
        ],
      });

    expect(response.status).toBe(403);
  });

  it('should return 400 with invalid payload', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/products/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        products: [],
      });

    expect(response.status).toBe(400);
  });
});
