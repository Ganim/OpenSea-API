import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Item Reservation (E2E)', () => {
  let userToken: string;
  let itemId: string;
  let userId: string;

  beforeAll(async () => {
    await app.ready();

    const { token, user } = await createAndAuthenticateUser(app);
    userToken = token;
    userId = user.user.id;

    // Create test data
    const { randomUUID } = await import('node:crypto');
    const unique = randomUUID();

    const template = await prisma.template.create({
      data: {
        name: `Test Template ${unique}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Test Product ${unique}`,
        code: `TEST-${unique}`,
        status: 'ACTIVE',
        attributes: {},
        templateId: template.id,
      },
    });

    const variant = await prisma.variant.create({
      data: {
        sku: `SKU-${unique}`,
        name: 'Test Variant',
        price: 100,
        attributes: {},
        productId: product.id,
      },
    });

    const location = await prisma.location.create({
      data: {
        code: `C${unique.toString().slice(-4)}`,
        titulo: `Test Location ${unique}`,
        type: 'WAREHOUSE',
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-${unique}`,
        initialQuantity: 100,
        currentQuantity: 100,
        attributes: {},
        variantId: variant.id,
        locationId: location.id,
      },
    });

    itemId = item.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create an item reservation', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app.server)
      .post('/v1/item-reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        itemId,
        userId,
        quantity: 10,
        reason: 'Test reservation',
        expiresAt: tomorrow.toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.reservation).toMatchObject({
      itemId,
      userId,
      quantity: 10,
      reason: 'Test reservation',
      isActive: true,
      isReleased: false,
    });
  });

  it('should not be able to create a reservation without authentication', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app.server)
      .post('/v1/item-reservations')
      .send({
        itemId,
        userId,
        quantity: 10,
        expiresAt: tomorrow.toISOString(),
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to create a reservation with quantity <= 0', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app.server)
      .post('/v1/item-reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        itemId,
        userId,
        quantity: 0,
        expiresAt: tomorrow.toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a reservation with past expiration date', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const response = await request(app.server)
      .post('/v1/item-reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        itemId,
        userId,
        quantity: 10,
        expiresAt: yesterday.toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a reservation with non-existent item', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app.server)
      .post('/v1/item-reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        itemId: '00000000-0000-0000-0000-000000000000',
        userId,
        quantity: 10,
        expiresAt: tomorrow.toISOString(),
      });

    expect(response.status).toBe(404);
  });

  it('should not be able to create a reservation exceeding available quantity', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app.server)
      .post('/v1/item-reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        itemId,
        userId,
        quantity: 1000, // More than available (100)
        expiresAt: tomorrow.toISOString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Insufficient available quantity');
  });
});
