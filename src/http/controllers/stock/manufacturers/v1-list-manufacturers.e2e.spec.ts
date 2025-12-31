import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Manufacturers (E2E)', () => {
  let token: string;

  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app,
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list manufacturers', async () => {
    const timestamp = Date.now();

    // Create multiple manufacturers
    await prisma.manufacturer.createMany({
      data: [
        {
          name: `Manufacturer A ${timestamp}`,
          country: 'United States',
          email: `manufacturera${timestamp}@example.com`,
          phone: '+1-555-0100',
          website: `https://manufacturera${timestamp}.com`,
          isActive: true,
        },
        {
          name: `Manufacturer B ${timestamp}`,
          country: 'Germany',
          email: `manufacturerb${timestamp}@example.com`,
          isActive: true,
        },
        {
          name: `Manufacturer C ${timestamp}`,
          country: 'Japan',
          isActive: false,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/manufacturers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.manufacturers).toBeInstanceOf(Array);
    expect(response.body.manufacturers.length).toBeGreaterThanOrEqual(3);

    // Verify the structure of manufacturers in the response
    const manufacturerA = response.body.manufacturers.find(
      (m: { name: string }) => m.name === `Manufacturer A ${timestamp}`,
    );
    const manufacturerB = response.body.manufacturers.find(
      (m: { name: string }) => m.name === `Manufacturer B ${timestamp}`,
    );
    const manufacturerC = response.body.manufacturers.find(
      (m: { name: string }) => m.name === `Manufacturer C ${timestamp}`,
    );

    expect(manufacturerA).toMatchObject({
      id: expect.any(String),
      name: `Manufacturer A ${timestamp}`,
      country: 'United States',
      email: `manufacturera${timestamp}@example.com`,
      phone: '+1-555-0100',
      website: `https://manufacturera${timestamp}.com`,
      isActive: true,
    });

    expect(manufacturerB).toMatchObject({
      id: expect.any(String),
      name: `Manufacturer B ${timestamp}`,
      country: 'Germany',
      email: `manufacturerb${timestamp}@example.com`,
      isActive: true,
    });

    expect(manufacturerC).toMatchObject({
      id: expect.any(String),
      name: `Manufacturer C ${timestamp}`,
      country: 'Japan',
      isActive: false,
    });
  });
});
