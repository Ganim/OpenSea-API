import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createCustomer } from '@/utils/tests/factories/sales/create-customer.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

describe('List Sales Orders (E2E)', () => {
  let userToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    userToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list sales orders with pagination', async () => {
    const timestamp = Date.now();
    const { customerId } = await createCustomer({
      name: `List Customer ${timestamp}`,
    });
    const { productId } = await createProduct({
      name: `List Product ${timestamp}`,
    });
    const { variantId } = await createVariant({
      productId,
      name: `List Variant ${timestamp}`,
      sku: `SKU-LIST-${timestamp}`,
    });

    // Create orders directly via Prisma with explicit IDs
    const { randomUUID } = await import('node:crypto');

    await prisma.salesOrder.create({
      data: {
        id: randomUUID(),
        orderNumber: `SO-LIST-1-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        items: {
          create: [
            {
              id: randomUUID(),
              variantId,
              quantity: 1,
              unitPrice: 100,
              totalPrice: 100,
            },
          ],
        },
      },
    });

    await prisma.salesOrder.create({
      data: {
        id: randomUUID(),
        orderNumber: `SO-LIST-2-${timestamp}`,
        customerId,
        status: 'PENDING',
        totalPrice: 200,
        discount: 0,
        finalPrice: 200,
        items: {
          create: [
            {
              id: randomUUID(),
              variantId,
              quantity: 2,
              unitPrice: 100,
              totalPrice: 200,
            },
          ],
        },
      },
    });

    const response = await request(app.server)
      .get('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ page: 1, perPage: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('salesOrders');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('perPage');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.salesOrders)).toBe(true);
    expect(response.body.salesOrders.length).toBeGreaterThan(0);
  });

  it('should be able to filter sales orders by customer', async () => {
    const timestamp = Date.now();
    const { customerId } = await createCustomer({
      name: `Filter Customer ${timestamp}`,
    });
    const { productId } = await createProduct({
      name: `Filter Product ${timestamp}`,
    });
    const { variantId } = await createVariant({
      productId,
      name: `Filter Variant ${timestamp}`,
      sku: `SKU-FILTER-${timestamp}`,
    });

    // Create order for this customer
    await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-FILTER-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        items: {
          create: [
            {
              variantId,
              quantity: 1,
              unitPrice: 100,
              totalPrice: 100,
            },
          ],
        },
      },
    });

    const response = await request(app.server)
      .get('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ page: 1, perPage: 10, customerId });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.salesOrders)).toBe(true);
    // All orders should have the same customerId
    response.body.salesOrders.forEach((order: { customerId: string }) => {
      expect(order.customerId).toBe(customerId);
    });
  });

  it('should be able to filter sales orders by status', async () => {
    const timestamp = Date.now();
    const { customerId } = await createCustomer({
      name: `Status Customer ${timestamp}`,
    });
    const { productId } = await createProduct({
      name: `Status Product ${timestamp}`,
    });
    const { variantId } = await createVariant({
      productId,
      name: `Status Variant ${timestamp}`,
      sku: `SKU-STATUS-${timestamp}`,
    });

    // Create order with DRAFT status
    await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-STATUS-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        items: {
          create: [
            {
              variantId,
              quantity: 1,
              unitPrice: 100,
              totalPrice: 100,
            },
          ],
        },
      },
    });

    const response = await request(app.server)
      .get('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ page: 1, perPage: 10, status: 'DRAFT' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.salesOrders)).toBe(true);
    // All orders should have DRAFT status
    response.body.salesOrders.forEach((order: { status: string }) => {
      expect(order.status).toBe('DRAFT');
    });
  });

  it('should not be able to list sales orders without authentication', async () => {
    const response = await request(app.server)
      .get('/v1/sales-orders')
      .query({ page: 1, perPage: 10 });

    expect(response.status).toBe(401);
  });

  it('should return empty array when no orders match filters', async () => {
    // Using a valid UUID v4 format that doesn't exist in database
    const nonExistentCustomerId = '123e4567-e89b-12d3-a456-426614174099';

    const response = await request(app.server)
      .get(
        `/v1/sales-orders?page=1&perPage=10&customerId=${nonExistentCustomerId}`,
      )
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.salesOrders).toEqual([]);
  });
});
