import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Release Item Reservation (E2E)', () => {
  let userToken: string;
  let itemId: string;
  let userId: string;
  let reservationId: string;
  let releasedReservationId: string;

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
        unitOfMeasure: 'UNITS',
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

    // Create an already released reservation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const released = await prisma.itemReservation.create({
      data: {
        itemId,
        userId,
        quantity: 5,
        reason: 'Released Reservation',
        expiresAt: tomorrow,
        releasedAt: yesterday,
      },
    });

    releasedReservationId = released.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to release a reservation', async () => {
    const response = await request(app.server)
      .patch(`/v1/item-reservations/${reservationId}/release`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.reservation).toMatchObject({
      id: reservationId,
      isReleased: true,
      isActive: false,
    });
    expect(response.body.reservation.releasedAt).toBeTruthy();
  });

  it('should not be able to release a reservation without authentication', async () => {
    const response = await request(app.server).patch(
      `/v1/item-reservations/${reservationId}/release`,
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 when reservation does not exist', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/item-reservations/00000000-0000-0000-0000-000000000000/release',
      )
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it('should not be able to release an already released reservation', async () => {
    const response = await request(app.server)
      .patch(`/v1/item-reservations/${releasedReservationId}/release`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already released');
  });
});
