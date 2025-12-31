import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Purchase Order (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a purchase order', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier PO ${timestamp}`,
        isActive: true,
      },
    });

    // Create complete setup for variant
    const template = await prisma.template.create({
      data: {
        name: `Template PO ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-PO-${timestamp}`,
        name: `Product PO ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-PO-${timestamp}`,
        name: `Variant PO ${timestamp}`,
        price: 150,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: `PO-${timestamp}`,
        supplierId: supplier.id,
        expectedDate: new Date('2025-12-31').toISOString(),
        notes: 'Test purchase order',
        items: [
          {
            variantId: variant.id,
            quantity: 50,
            unitCost: 100,
            notes: 'Test item',
          },
        ],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.purchaseOrder).toBeDefined();
    expect(response.body.purchaseOrder.orderNumber).toBe(`PO-${timestamp}`);
    expect(response.body.purchaseOrder.supplierId).toBe(supplier.id);
    expect(response.body.purchaseOrder.status).toBe('PENDING');
    expect(response.body.purchaseOrder.totalCost).toBe(5000); // 50 * 100
    expect(response.body.purchaseOrder.items).toHaveLength(1);
    expect(response.body.purchaseOrder.items[0].quantity).toBe(50);
    expect(response.body.purchaseOrder.items[0].unitCost).toBe(100);
    expect(response.body.purchaseOrder.items[0].totalCost).toBe(5000);
  });

  it('should NOT allow user without permission to create a purchase order', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const timestamp = Date.now();

    // Create valid supplier and variant
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier User Test ${timestamp}`,
        isActive: true,
      },
    });

    const template = await prisma.template.create({
      data: {
        name: `Template User Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-USER-${timestamp}`,
        name: `Product User ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-USER-${timestamp}`,
        name: `Variant User ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: `PO-USER-${timestamp}`,
        supplierId: supplier.id,
        items: [
          {
            variantId: variant.id,
            quantity: 10,
            unitCost: 50,
          },
        ],
      });

    expect(response.statusCode).toBe(403);
  });

  it('should NOT allow duplicate order number', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier Duplicate ${timestamp}`,
        isActive: true,
      },
    });

    // Create variant
    const template = await prisma.template.create({
      data: {
        name: `Template Duplicate ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-DUP-${timestamp}`,
        name: `Product Duplicate ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-DUP-${timestamp}`,
        name: `Variant Duplicate ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const orderNumber = `PO-DUPLICATE-${timestamp}`;

    // Create first order
    await request(app.server)
      .post('/v1/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber,
        supplierId: supplier.id,
        items: [
          {
            variantId: variant.id,
            quantity: 10,
            unitCost: 50,
          },
        ],
      });

    // Try to create duplicate
    const response = await request(app.server)
      .post('/v1/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber,
        supplierId: supplier.id,
        items: [
          {
            variantId: variant.id,
            quantity: 20,
            unitCost: 50,
          },
        ],
      });

    expect(response.statusCode).toBe(400);
  });

  it('should NOT allow creating purchase order with non-existent supplier', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create valid variant
    const template = await prisma.template.create({
      data: {
        name: `Template Invalid Supplier ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-INVALID-${timestamp}`,
        name: `Product Invalid ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-INVALID-${timestamp}`,
        name: `Variant Invalid ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: `PO-INVALID-${timestamp}`,
        supplierId: '00000000-0000-0000-0000-000000000000',
        items: [
          {
            variantId: variant.id,
            quantity: 10,
            unitCost: 50,
          },
        ],
      });

    expect(response.statusCode).toBe(404);
  });
});
