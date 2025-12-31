import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Location (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a location', async () => {
    const timestamp = Date.now();
    const location = await prisma.location.create({
      data: {
        code: `U${timestamp.toString().slice(-4)}`,
        titulo: 'Old Description',
        type: 'WAREHOUSE',
        capacity: 1000,
        currentOccupancy: 250,
      },
    });

    const response = await request(app.server)
      .put(`/v1/locations/${location.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        titulo: 'New Description',
        capacity: 2000,
        currentOccupancy: 500,
      });

    expect(response.status).toBe(200);
    expect(response.body.location).toEqual(
      expect.objectContaining({
        id: location.id,
        code: `U${timestamp.toString().slice(-4)}`,
        titulo: 'New Description',
        capacity: 2000,
        currentOccupancy: 500,
        isActive: true,
      }),
    );
  });

  it('should be able to update location label', async () => {
    const timestamp = Date.now();
    const location = await prisma.location.create({
      data: {
        code: `LU${timestamp.toString().slice(-2)}`,
        titulo: 'Warehouse to Label',
        type: 'WAREHOUSE',
      },
    });

    const response = await request(app.server)
      .put(`/v1/locations/${location.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        label: 'Updated label for warehouse',
      });

    expect(response.status).toBe(200);
    expect(response.body.location.label).toBe('Updated label for warehouse');
  });

  it('should not be able to update a non-existent location', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/locations/${nonExistentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        titulo: 'New Description',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Location not found');
  });

  it('should not be able to update with duplicate code', async () => {
    const timestamp = Date.now();

    // Create two locations
    const location1 = await prisma.location.create({
      data: {
        code: `1${timestamp.toString().slice(-4)}`,
        titulo: 'Location 1',
        type: 'WAREHOUSE',
      },
    });

    await prisma.location.create({
      data: {
        code: `2${timestamp.toString().slice(-4)}`,
        titulo: 'Location 2',
        type: 'WAREHOUSE',
      },
    });

    // Try to update location1 with location2's code
    const response = await request(app.server)
      .put(`/v1/locations/${location1.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: `2${timestamp.toString().slice(-4)}`,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Location with this code already exists',
    );
  });
});
