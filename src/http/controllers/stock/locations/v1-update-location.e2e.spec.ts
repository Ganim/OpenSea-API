import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Location (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a location', async () => {
    const timestamp = Date.now();
    const location = await prisma.location.create({
      data: {
        code: `WH-UPDATE-${timestamp}`,
        description: 'Old Description',
        locationType: 'WAREHOUSE',
        capacity: 1000,
        currentOccupancy: 250,
      },
    });

    const response = await request(app.server)
      .put(`/v1/locations/${location.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        description: 'New Description',
        capacity: 2000,
        currentOccupancy: 500,
      });

    expect(response.status).toBe(200);
    expect(response.body.location).toEqual(
      expect.objectContaining({
        id: location.id,
        code: `WH-UPDATE-${timestamp}`,
        description: 'New Description',
        capacity: 2000,
        currentOccupancy: 500,
        isActive: true,
      }),
    );
  });

  it('should be able to change location code', async () => {
    const timestamp = Date.now();
    const location = await prisma.location.create({
      data: {
        code: `WH-CODE-OLD-${timestamp}`,
        description: 'Test Location',
      },
    });

    const response = await request(app.server)
      .put(`/v1/locations/${location.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: `WH-CODE-NEW-${timestamp}`,
      });

    expect(response.status).toBe(200);
    expect(response.body.location.code).toBe(`WH-CODE-NEW-${timestamp}`);
  });

  it('should not be able to update a non-existent location', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/locations/${nonExistentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        description: 'New Description',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Location not found');
  });

  it('should not be able to update with duplicate code', async () => {
    const timestamp = Date.now();

    // Create two locations
    const location1 = await prisma.location.create({
      data: {
        code: `WH-DUP-1-${timestamp}`,
        description: 'Location 1',
      },
    });

    await prisma.location.create({
      data: {
        code: `WH-DUP-2-${timestamp}`,
        description: 'Location 2',
      },
    });

    // Try to update location1 with location2's code
    const response = await request(app.server)
      .put(`/v1/locations/${location1.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: `WH-DUP-2-${timestamp}`,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Location with this code already exists',
    );
  });
});
