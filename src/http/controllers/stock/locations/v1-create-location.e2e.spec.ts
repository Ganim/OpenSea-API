import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Location (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a location with all fields', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: `LOC-${timestamp}`,
        description: 'Main Warehouse',
        locationType: 'WAREHOUSE',
        capacity: 1000,
        currentOccupancy: 250,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      location: {
        id: expect.any(String),
        code: `LOC-${timestamp}`,
        description: 'Main Warehouse',
        locationType: 'WAREHOUSE',
        capacity: 1000,
        currentOccupancy: 250,
        isActive: true,
      },
    });
  });

  it('should be able to create a location with minimal data', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: `MIN-${timestamp}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      location: {
        id: expect.any(String),
        code: `MIN-${timestamp}`,
        currentOccupancy: 0,
        isActive: true,
      },
    });
  });

  it('should be able to create a location with parent', async () => {
    const timestamp = Date.now();

    // Create parent location first
    const parent = await prisma.location.create({
      data: {
        code: `PARENT-${timestamp}`,
        locationType: 'WAREHOUSE',
        currentOccupancy: 0,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: `CHILD-${timestamp}`,
        description: 'Child Location',
        locationType: 'ZONE',
        parentId: parent.id,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      location: {
        id: expect.any(String),
        code: `CHILD-${timestamp}`,
        description: 'Child Location',
        locationType: 'ZONE',
        parentId: parent.id,
        currentOccupancy: 0,
        isActive: true,
      },
    });
  });

  it('should not be able to create a location with duplicate code', async () => {
    const timestamp = Date.now();
    const duplicateCode = `DUP-${timestamp}`;

    // Create first location
    await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: duplicateCode,
      });

    // Try to create second location with same code
    const response = await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: duplicateCode,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Location with this code already exists',
    );
  });

  it('should not be able to create a location without authentication', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/locations')
      .send({
        code: `UNAUTH-${timestamp}`,
      });

    expect(response.status).toBe(401);
  });
});
