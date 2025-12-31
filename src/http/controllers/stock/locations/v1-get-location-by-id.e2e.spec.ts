import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Location By ID (E2E)', () => {
  let authToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    authToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get location by id', async () => {
    const timestamp = Date.now();
    const location = await prisma.location.create({
      data: {
        code: `G${timestamp.toString().slice(-4)}`,
        titulo: 'Main Warehouse',
        type: 'WAREHOUSE',
        capacity: 5000,
        currentOccupancy: 1250,
      },
    });

    const response = await request(app.server)
      .get(`/v1/locations/${location.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.location).toEqual(
      expect.objectContaining({
        id: location.id,
        code: `G${timestamp.toString().slice(-4)}`,
        titulo: 'Main Warehouse',
        type: 'WAREHOUSE',
        capacity: 5000,
        currentOccupancy: 1250,
        isActive: true,
      }),
    );
  });

  it('should return 404 when location does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/locations/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Location not found');
  });
});
