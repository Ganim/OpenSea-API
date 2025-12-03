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
        code: `L${timestamp.toString().slice(-4)}`,
        titulo: 'Main Warehouse',
        type: 'WAREHOUSE',
        capacity: 1000,
        currentOccupancy: 250,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      location: {
        id: expect.any(String),
        code: `L${timestamp.toString().slice(-4)}`,
        titulo: 'Main Warehouse',
        type: 'WAREHOUSE',
        capacity: 1000,
        currentOccupancy: 250,
        isActive: true,
      },
    });
  });

  it('should be able to create a location with label', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: `LB${timestamp.toString().slice(-3)}`,
        titulo: 'Labeled Warehouse',
        label: 'Primary storage facility for electronics',
        type: 'WAREHOUSE',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      location: {
        id: expect.any(String),
        code: `LB${timestamp.toString().slice(-3)}`,
        titulo: 'Labeled Warehouse',
        label: 'Primary storage facility for electronics',
        type: 'WAREHOUSE',
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
        code: `P${timestamp.toString().slice(-4)}`,
        titulo: 'Parent Warehouse',
        type: 'WAREHOUSE',
        currentOccupancy: 0,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: `C${timestamp.toString().slice(-4)}`,
        titulo: 'Child Location',
        type: 'ZONE',
        parentId: parent.id,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      location: {
        id: expect.any(String),
        code: `C${timestamp.toString().slice(-4)}`,
        titulo: 'Child Location',
        type: 'ZONE',
        parentId: parent.id,
        currentOccupancy: 0,
        isActive: true,
      },
    });
  });

  it('should be able to create locations with duplicate codes', async () => {
    const timestamp = Date.now();
    const duplicateCode = `D${timestamp.toString().slice(-4)}`;

    // Create first location
    const response1 = await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: duplicateCode,
        titulo: 'First Location',
        type: 'WAREHOUSE',
      });

    expect(response1.status).toBe(201);

    // Create second location with same code (should succeed)
    const response2 = await request(app.server)
      .post('/v1/locations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: duplicateCode,
        titulo: 'Second Location',
        type: 'WAREHOUSE',
      });

    expect(response2.status).toBe(201);
  });

  it('should not be able to create a location without authentication', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/locations')
      .send({
        code: `U${timestamp.toString().slice(-4)}`,
        titulo: 'Unauth Location',
        type: 'WAREHOUSE',
      });

    expect(response.status).toBe(401);
  });
});
