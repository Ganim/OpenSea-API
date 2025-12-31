import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

describe('List Locations by Location ID (E2E)', () => {
  let authToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    authToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data - delete item movements first due to foreign key constraints
    await prisma.itemMovement.deleteMany({
      where: {
        item: {
          location: {
            OR: [
              { code: { startsWith: 'P' } },
              { code: { startsWith: 'S' } },
              { code: { startsWith: 'O' } },
              { code: { startsWith: 'I' } },
              { code: { startsWith: 'E' } },
            ],
          },
        },
      },
    });
    // Then delete items
    await prisma.item.deleteMany({
      where: {
        location: {
          OR: [
            { code: { startsWith: 'P' } },
            { code: { startsWith: 'S' } },
            { code: { startsWith: 'O' } },
            { code: { startsWith: 'I' } },
            { code: { startsWith: 'E' } },
          ],
        },
      },
    });
    // Finally delete locations
    await prisma.location.deleteMany({
      where: {
        OR: [
          { code: { startsWith: 'P' } },
          { code: { startsWith: 'S' } },
          { code: { startsWith: 'O' } },
          { code: { startsWith: 'I' } },
          { code: { startsWith: 'E' } },
        ],
      },
    });
  });

  beforeEach(async () => {
    // Ensure clean state before each test - delete item movements first due to foreign key constraints
    await prisma.itemMovement.deleteMany({
      where: {
        item: {
          location: {
            OR: [
              { code: { startsWith: 'P' } },
              { code: { startsWith: 'S' } },
              { code: { startsWith: 'O' } },
              { code: { startsWith: 'I' } },
              { code: { startsWith: 'E' } },
            ],
          },
        },
      },
    });
    // Then delete items
    await prisma.item.deleteMany({
      where: {
        location: {
          OR: [
            { code: { startsWith: 'P' } },
            { code: { startsWith: 'S' } },
            { code: { startsWith: 'O' } },
            { code: { startsWith: 'I' } },
            { code: { startsWith: 'E' } },
          ],
        },
      },
    });
    // Finally delete locations
    await prisma.location.deleteMany({
      where: {
        OR: [
          { code: { startsWith: 'P' } },
          { code: { startsWith: 'S' } },
          { code: { startsWith: 'O' } },
          { code: { startsWith: 'I' } },
          { code: { startsWith: 'E' } },
        ],
      },
    });
  });

  it('should be able to list sub-locations by location ID', async () => {
    const timestamp = Date.now();

    // Create parent location (warehouse)
    const parentLocation = await prisma.location.create({
      data: {
        code: `P${timestamp.toString().slice(-4)}`,
        titulo: 'Parent Warehouse',
        type: 'WAREHOUSE',
        capacity: 10000,
        currentOccupancy: 1000,
        isActive: true,
      },
    });

    // Create sub-locations (zones)
    await prisma.location.create({
      data: {
        code: `S${timestamp.toString().slice(-3)}1`,
        titulo: 'Zone 1',
        type: 'ZONE',
        parentId: parentLocation.id,
        capacity: 2000,
        currentOccupancy: 500,
        isActive: true,
      },
    });

    await prisma.location.create({
      data: {
        code: `S${timestamp.toString().slice(-3)}2`,
        titulo: 'Zone 2',
        type: 'ZONE',
        parentId: parentLocation.id,
        capacity: 3000,
        currentOccupancy: 750,
        isActive: true,
      },
    });

    // Create another location that should NOT be included (different parent)
    await prisma.location.create({
      data: {
        code: `O${timestamp.toString().slice(-4)}`,
        titulo: 'Other Warehouse',
        type: 'WAREHOUSE',
        capacity: 5000,
        currentOccupancy: 250,
        isActive: true,
      },
    });

    // Create inactive sub-location (should not be included)
    await prisma.location.create({
      data: {
        code: `I${timestamp.toString().slice(-4)}`,
        titulo: 'Inactive Zone',
        type: 'ZONE',
        parentId: parentLocation.id,
        capacity: 1000,
        currentOccupancy: 100,
        isActive: false, // Should not be included
      },
    });

    const response = await request(app.server)
      .get(`/v1/locations/${parentLocation.id}/sub-locations`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.locations).toBeInstanceOf(Array);
    expect(response.body.locations).toHaveLength(2); // Only 2 active sub-locations

    // Check that the returned locations are the correct ones
    const returnedLocationCodes = response.body.locations.map(
      (loc: { code: string }) => loc.code,
    );

    expect(returnedLocationCodes).toContain(
      `S${timestamp.toString().slice(-3)}1`,
    );
    expect(returnedLocationCodes).toContain(
      `S${timestamp.toString().slice(-3)}2`,
    );
    expect(returnedLocationCodes).not.toContain(
      `O${timestamp.toString().slice(-4)}`,
    );
    expect(returnedLocationCodes).not.toContain(
      `I${timestamp.toString().slice(-4)}`,
    );

    // Check structure of returned locations
    response.body.locations.forEach((location: Record<string, unknown>) => {
      expect(location).toHaveProperty('id');
      expect(location).toHaveProperty('code');
      expect(location).toHaveProperty('titulo');
      expect(location).toHaveProperty('type');
      expect(location).toHaveProperty('parentId', parentLocation.id);
      expect(location).toHaveProperty('capacity');
      expect(location).toHaveProperty('currentOccupancy');
      expect(location).toHaveProperty('isActive', true);
      expect(location).toHaveProperty('subLocationCount');
      expect(location).toHaveProperty('directItemCount');
      expect(location).toHaveProperty('totalItemCount');
      expect(location).toHaveProperty('createdAt');
      expect(location).toHaveProperty('updatedAt');
    });

    // Check specific location details
    const zone1 = response.body.locations.find(
      (loc: { code: string }) =>
        loc.code === `S${timestamp.toString().slice(-3)}1`,
    );
    expect(zone1).toMatchObject({
      code: `S${timestamp.toString().slice(-3)}1`,
      titulo: 'Zone 1',
      type: 'ZONE',
      parentId: parentLocation.id,
      capacity: 2000,
      currentOccupancy: 500,
      isActive: true,
      subLocationCount: 0, // No sub-locations for zones
      directItemCount: 0, // No items directly in this location
      totalItemCount: 0, // No items in this location or sub-locations
    });

    const zone2 = response.body.locations.find(
      (loc: { code: string }) =>
        loc.code === `S${timestamp.toString().slice(-3)}2`,
    );
    expect(zone2).toMatchObject({
      code: `S${timestamp.toString().slice(-3)}2`,
      titulo: 'Zone 2',
      type: 'ZONE',
      parentId: parentLocation.id,
      capacity: 3000,
      currentOccupancy: 750,
      isActive: true,
      subLocationCount: 0,
      directItemCount: 0,
      totalItemCount: 0,
    });
  });

  it('should return empty array when location has no sub-locations', async () => {
    const timestamp = Date.now();

    // Create a location without sub-locations
    const locationWithoutSubs = await prisma.location.create({
      data: {
        code: `E${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse without sub-locations',
        type: 'WAREHOUSE',
        capacity: 5000,
        currentOccupancy: 100,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/locations/${locationWithoutSubs.id}/sub-locations`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.locations).toBeInstanceOf(Array);
    expect(response.body.locations).toHaveLength(0);
  });

  it('should return 400 when locationId is not a valid UUID', async () => {
    const response = await request(app.server)
      .get('/v1/locations/invalid-uuid/sub-locations')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(400);
  });
});
