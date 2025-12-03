import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List and Get Item Reservations (E2E)', () => {
  let userToken: string;
  let itemId: string;
  let userId: string;
  let reservationId: string;

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

    // Create reservations
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeReservation = await prisma.itemReservation.create({
      data: {
        itemId,
        userId,
        quantity: 10,
        reason: 'Active Reservation',
        expiresAt: tomorrow,
      },
    });

    reservationId = activeReservation.id;

    // Create a released reservation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.itemReservation.create({
      data: {
        itemId,
        userId,
        quantity: 5,
        reason: 'Released Reservation',
        expiresAt: tomorrow,
        releasedAt: yesterday,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a reservation by id', async () => {
    const response = await request(app.server)
      .get(`/v1/item-reservations/${reservationId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.reservation).toMatchObject({
      id: reservationId,
      itemId,
      userId,
      quantity: 10,
      reason: 'Active Reservation',
    });
  });

  it('should return 404 when reservation does not exist', async () => {
    const response = await request(app.server)
      .get('/v1/item-reservations/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it('should be able to list reservations by item', async () => {
    const response = await request(app.server)
      .get(`/v1/item-reservations`)
      .query({ itemId })
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.reservations).toHaveLength(2); // Active and released
    expect(response.body.reservations[0].itemId).toBe(itemId);
    expect(response.body.reservations[1].itemId).toBe(itemId);
  });

  it('should be able to list only active reservations', async () => {
    const response = await request(app.server)
      .get(`/v1/item-reservations`)
      .query({ itemId, activeOnly: 'true' })
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.reservations).toHaveLength(1);
    expect(response.body.reservations[0].isActive).toBe(true);
  });

  it('should be able to list reservations by user', async () => {
    const response = await request(app.server)
      .get(`/v1/item-reservations`)
      .query({ userId })
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.reservations.length).toBeGreaterThanOrEqual(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.body.reservations.forEach((reservation: any) => {
      expect(reservation.userId).toBe(userId);
    });
  });

  it('should return empty array when no filters provided', async () => {
    const response = await request(app.server)
      .get('/v1/item-reservations')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.reservations).toEqual([]);
  });
});
