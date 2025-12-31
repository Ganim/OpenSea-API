import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Locations (E2E)', () => {
  let authToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
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
          code: `L${timestamp.toString().slice(-4)}`,
          titulo: 'Warehouse 1',
          type: 'WAREHOUSE',
          capacity: 1000,
          currentOccupancy: 250,
          isActive: true,
        },
        {
          code: `L${timestamp.toString().slice(-3)}2`,
          titulo: 'Warehouse 2',
          type: 'WAREHOUSE',
          capacity: 2000,
          currentOccupancy: 500,
          isActive: true,
        },
        {
          code: `L${timestamp.toString().slice(-3)}3`,
          titulo: 'Warehouse 3',
          type: 'WAREHOUSE',
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
        loc.code === `L${timestamp.toString().slice(-4)}` ||
        loc.code === `L${timestamp.toString().slice(-3)}2` ||
        loc.code === `L${timestamp.toString().slice(-3)}3`,
    );

    expect(returnedLocations).toHaveLength(2); // Only 2 active locations
    expect(returnedLocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: `L${timestamp.toString().slice(-4)}`,
          titulo: 'Warehouse 1',
          isActive: true,
        }),
        expect.objectContaining({
          code: `L${timestamp.toString().slice(-3)}2`,
          titulo: 'Warehouse 2',
          isActive: true,
        }),
      ]),
    );

    // Ensure inactive location is not returned
    expect(returnedLocations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: `L${timestamp.toString().slice(-3)}3`,
        }),
      ]),
    );
  });

  it('should be able to filter locations by type', async () => {
    const timestamp = Date.now();

    // Create test locations of different types
    await prisma.location.createMany({
      data: [
        {
          code: `F${timestamp.toString().slice(-4)}`,
          titulo: 'Warehouse for filtering',
          type: 'WAREHOUSE',
          capacity: 1000,
          currentOccupancy: 250,
          isActive: true,
        },
        {
          code: `F${timestamp.toString().slice(-3)}2`,
          titulo: 'Zone for filtering',
          type: 'ZONE',
          capacity: 500,
          currentOccupancy: 100,
          isActive: true,
        },
        {
          code: `F${timestamp.toString().slice(-3)}3`,
          titulo: 'Aisle for filtering',
          type: 'AISLE',
          capacity: 200,
          currentOccupancy: 50,
          isActive: true,
        },
      ],
    });

    // Test filtering by WAREHOUSE
    const warehouseResponse = await request(app.server)
      .get('/v1/locations?locationType=WAREHOUSE')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(warehouseResponse.status).toBe(200);
    expect(warehouseResponse.body.locations).toBeInstanceOf(Array);

    const warehouseLocations = warehouseResponse.body.locations.filter(
      (loc: { code: string }) =>
        loc.code === `F${timestamp.toString().slice(-4)}`,
    );

    expect(warehouseLocations).toHaveLength(1);
    expect(warehouseLocations[0]).toMatchObject({
      code: `F${timestamp.toString().slice(-4)}`,
      titulo: 'Warehouse for filtering',
      type: 'WAREHOUSE',
      isActive: true,
    });

    // Test filtering by ZONE
    const zoneResponse = await request(app.server)
      .get('/v1/locations?locationType=ZONE')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(zoneResponse.status).toBe(200);
    expect(zoneResponse.body.locations).toBeInstanceOf(Array);

    const zoneLocations = zoneResponse.body.locations.filter(
      (loc: { code: string }) =>
        loc.code === `F${timestamp.toString().slice(-3)}2`,
    );

    expect(zoneLocations).toHaveLength(1);
    expect(zoneLocations[0]).toMatchObject({
      code: `F${timestamp.toString().slice(-3)}2`,
      titulo: 'Zone for filtering',
      type: 'ZONE',
      isActive: true,
    });

    // Test filtering by AISLE
    const aisleResponse = await request(app.server)
      .get('/v1/locations?locationType=AISLE')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(aisleResponse.status).toBe(200);
    expect(aisleResponse.body.locations).toBeInstanceOf(Array);

    const aisleLocations = aisleResponse.body.locations.filter(
      (loc: { code: string }) =>
        loc.code === `F${timestamp.toString().slice(-3)}3`,
    );

    expect(aisleLocations).toHaveLength(1);
    expect(aisleLocations[0]).toMatchObject({
      code: `F${timestamp.toString().slice(-3)}3`,
      titulo: 'Aisle for filtering',
      type: 'AISLE',
      isActive: true,
    });
  });
});
