import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Manufacturer By ID (E2E)', () => {
  let token: string;

  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app,
      'MANAGER',
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a manufacturer by id', async () => {
    // Create a manufacturer
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: 'Test Manufacturer',
        country: 'United States',
        email: 'test@manufacturer.com',
        phone: '+1-555-0100',
        website: 'https://testmanufacturer.com',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        rating: 4.5,
        notes: 'Test notes',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/manufacturers/${manufacturer.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      manufacturer: {
        id: manufacturer.id,
        name: 'Test Manufacturer',
        country: 'United States',
        email: 'test@manufacturer.com',
        phone: '+1-555-0100',
        website: 'https://testmanufacturer.com',
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        rating: 4.5,
        notes: 'Test notes',
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('should return 404 if manufacturer does not exist', async () => {
    const response = await request(app.server)
      .get('/v1/manufacturers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Manufacturer not found');
  });
});
