import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Manufacturer (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a manufacturer', async () => {
    const timestamp = Date.now();

    // Create a manufacturer
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Original Manufacturer ${timestamp}`,
        country: 'United States',
        email: `original${timestamp}@example.com`,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/manufacturers/${manufacturer.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Updated Manufacturer ${timestamp}`,
        country: 'Canada',
        email: `updated${timestamp}@example.com`,
        phone: '+1-555-0200',
        website: `https://updated${timestamp}.com`,
        rating: 4.8,
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      manufacturer: {
        id: manufacturer.id,
        name: `Updated Manufacturer ${timestamp}`,
        country: 'Canada',
        email: `updated${timestamp}@example.com`,
        phone: '+1-555-0200',
        website: `https://updated${timestamp}.com`,
        rating: 4.8,
        isActive: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('should return 404 when trying to update a non-existent manufacturer', async () => {
    const response = await request(app.server)
      .put('/v1/manufacturers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Manufacturer not found');
  });

  it('should return 400 when trying to update with a duplicate name', async () => {
    const timestamp = Date.now();

    // Create two manufacturers
    await prisma.manufacturer.create({
      data: {
        name: `Manufacturer A ${timestamp}`,
        country: 'United States',
        isActive: true,
      },
    });

    const manufacturerB = await prisma.manufacturer.create({
      data: {
        name: `Manufacturer B ${timestamp}`,
        country: 'United States',
        isActive: true,
      },
    });

    // Try to update Manufacturer B with the name of Manufacturer A
    const response = await request(app.server)
      .put(`/v1/manufacturers/${manufacturerB.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Manufacturer A ${timestamp}`,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Manufacturer with this name already exists',
    );
  });
});
