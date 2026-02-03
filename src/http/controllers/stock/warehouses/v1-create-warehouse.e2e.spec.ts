import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Warehouse (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new warehouse successfully', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const response = await request(app.server)
      .post('/v1/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
        description: 'Test warehouse description',
        address: 'Test address 123',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('warehouse');
    expect(response.body.warehouse).toMatchObject({
      code: `W${timestamp.slice(-4)}`,
      name: `Warehouse ${timestamp}`,
      description: 'Test warehouse description',
      address: 'Test address 123',
      isActive: true,
    });
    expect(response.body.warehouse.id).toBeDefined();

    const createdWarehouse = await prisma.warehouse.findUnique({
      where: { id: response.body.warehouse.id },
    });

    expect(createdWarehouse).toBeDefined();
    expect(createdWarehouse?.code).toBe(`W${timestamp.slice(-4)}`);
  });

  it('should not create warehouse without auth token', async () => {
    const response = await request(app.server).post('/v1/warehouses').send({
      code: 'WTEST',
      name: 'Test Warehouse',
    });

    expect(response.status).toBe(401);
  });
});
