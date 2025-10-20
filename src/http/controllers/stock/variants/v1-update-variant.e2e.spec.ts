import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('Update Variant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'MANAGER',
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a variant', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `Update Variant Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-UPDATE-${timestamp}`,
        name: `Product For Update ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create variant
    const variantDb = await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-UPDATE-${timestamp}`,
        name: `Old Variant Name ${timestamp}`,
        price: 99.99,
        attributes: { color: 'red' },
        costPrice: 50.0,
      },
    });

    const response = await request(app.server)
      .put(`/v1/variants/${variantDb.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Variant Name ${timestamp}`,
        price: 109.99,
        attributes: { color: 'blue' },
        costPrice: 55.0,
        minStock: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.variant).toEqual(
      expect.objectContaining({
        id: variantDb.id,
        name: `Updated Variant Name ${timestamp}`,
        price: 109.99,
        costPrice: 55.0,
        minStock: 5,
      }),
    );
  });

  it('should not be able to update variant with duplicate SKU', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `Update Variant Dup Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-UPDATE-DUP-${timestamp}`,
        name: `Product For Update Dup ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create first variant
    await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-EXISTS-${timestamp}`,
        name: `Existing Variant ${timestamp}`,
        price: 99.99,
        attributes: { color: 'red' },
      },
    });

    // Create second variant to update
    const variantToUpdate = await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-TO-UPDATE-${timestamp}`,
        name: `Variant To Update ${timestamp}`,
        price: 89.99,
        attributes: { color: 'blue' },
      },
    });

    // Try to update with existing SKU
    const response = await request(app.server)
      .put(`/v1/variants/${variantToUpdate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        sku: `SKU-EXISTS-${timestamp}`,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('SKU already exists');
  });

  it('should return 404 when variant does not exist', async () => {
    const response = await request(app.server)
      .put('/v1/variants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Non-existent Variant',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Variant not found');
  });
});
