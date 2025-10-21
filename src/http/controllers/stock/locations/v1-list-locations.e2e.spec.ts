import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Locations (E2E)', () => {
  let authToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    authToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list all active locations', async () => {
    const timestamp = Date.now();

    // Create test locations
    await prisma.location.createMany({
      data: [
        {
          code: `WH-LIST-${timestamp}-1`,
          description: 'Warehouse 1',
          locationType: 'WAREHOUSE',
          capacity: 1000,
          currentOccupancy: 250,
          isActive: true,
        },
        {
          code: `WH-LIST-${timestamp}-2`,
          description: 'Warehouse 2',
          locationType: 'WAREHOUSE',
          capacity: 2000,
          currentOccupancy: 500,
          isActive: true,
        },
        {
          code: `WH-LIST-${timestamp}-3`,
          description: 'Warehouse 3',
          locationType: 'WAREHOUSE',
          capacity: 3000,
          currentOccupancy: 750,
          isActive: false, // Should not be included in response
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/locations')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.locations).toBeInstanceOf(Array);

    // Check that only active locations are returned
    const returnedLocations = response.body.locations.filter(
      (loc: { code: string }) =>
        loc.code === `WH-LIST-${timestamp}-1` ||
        loc.code === `WH-LIST-${timestamp}-2` ||
        loc.code === `WH-LIST-${timestamp}-3`,
    );

    expect(returnedLocations).toHaveLength(2); // Only 2 active locations
    expect(returnedLocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: `WH-LIST-${timestamp}-1`,
          description: 'Warehouse 1',
          isActive: true,
        }),
        expect.objectContaining({
          code: `WH-LIST-${timestamp}-2`,
          description: 'Warehouse 2',
          isActive: true,
        }),
      ]),
    );

    // Ensure inactive location is not returned
    expect(returnedLocations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: `WH-LIST-${timestamp}-3`,
        }),
      ]),
    );
  });
});
