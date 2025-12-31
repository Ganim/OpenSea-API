import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('Delete Variant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a variant (soft delete)', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `Delete Variant Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-DELETE-${timestamp}`,
        name: `Product For Delete ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create variant
    const variantDb = await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-DELETE-${timestamp}`,
        name: `Variant To Delete ${timestamp}`,
        price: 99.99,
        attributes: { color: 'red' },
      },
    });

    const response = await request(app.server)
      .delete(`/v1/variants/${variantDb.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Verify soft delete
    const deletedVariant = await prisma.variant.findUnique({
      where: { id: variantDb.id },
    });

    expect(deletedVariant).toBeTruthy();
    expect(deletedVariant?.deletedAt).toBeTruthy();
  });

  it('should return 404 when variant does not exist', async () => {
    const response = await request(app.server)
      .delete('/v1/variants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Variant not found');
  });

  it('should not be able to delete the same variant twice', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `Delete Twice Variant Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-DELETE-TWICE-${timestamp}`,
        name: `Product For Delete Twice ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create variant
    const variantDb = await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-DELETE-TWICE-${timestamp}`,
        name: `Variant To Delete Twice ${timestamp}`,
        price: 99.99,
        attributes: { color: 'red' },
      },
    });

    // First deletion
    await request(app.server)
      .delete(`/v1/variants/${variantDb.id}`)
      .set('Authorization', `Bearer ${token}`);

    // Second deletion attempt
    const response = await request(app.server)
      .delete(`/v1/variants/${variantDb.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Variant not found');
  });

  it('should not allow deletion after the variant is already deleted', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `Pre-deleted Variant Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-PRE-DELETE-${timestamp}`,
        name: `Product For Pre-delete ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create variant with deletedAt already set
    const variantDb = await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-PRE-DELETE-${timestamp}`,
        name: `Pre-deleted Variant ${timestamp}`,
        price: 99.99,
        attributes: { color: 'red' },
        deletedAt: new Date(),
      },
    });

    const response = await request(app.server)
      .delete(`/v1/variants/${variantDb.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Variant not found');
  });
});
