import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Product (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER/ADMIN to CREATE a NEW PRODUCT', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template CREATE Test ${timestamp}`,
        productAttributes: {
          color: { type: 'string', required: false },
          size: { type: 'string', required: false },
        },
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productCode = `PROD-CREATE-${timestamp}`;
    const productName = `Test Product ${timestamp}`;

    const response = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: productName,
        code: productCode,
        description: 'Test Description',
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: {
          color: 'blue',
          size: 'medium',
        },
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body.product).toBeDefined();
    expect(response.body.product.name).toBe(productName);
    expect(response.body.product.code).toBe(productCode);
    expect(response.body.product.description).toBe('Test Description');
    expect(response.body.product.status).toBe('ACTIVE');
    expect(response.body.product.templateId).toBe(templateDb.id);
  });

  it('should NOT allow USER to CREATE a PRODUCT', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template Create Forbidden Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        code: `PROD-CREATE-FORBIDDEN-${timestamp}`,
        templateId: templateDb.id,
        status: 'ACTIVE',
        attributes: {},
      });

    expect(response.statusCode).toBe(403);
  });
});
