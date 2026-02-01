import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Warehouse (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update warehouse details successfully', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
        description: 'Original description',
        address: 'Original address',
        isActive: true,
      },
    });

    const newTimestamp = Date.now().toString();
    const response = await request(app.server)
      .patch(`/v1/warehouses/${warehouse.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `U${newTimestamp.slice(-4)}`,
        name: `Warehouse Updated ${newTimestamp}`,
        description: 'Updated description',
        address: 'Updated address',
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('warehouse');
    expect(response.body.warehouse).toMatchObject({
      id: warehouse.id,
      code: `U${newTimestamp.slice(-4)}`,
      name: `Warehouse Updated ${newTimestamp}`,
      description: 'Updated description',
      address: 'Updated address',
      isActive: false,
    });

    const updatedWarehouse = await prisma.warehouse.findUnique({
      where: { id: warehouse.id },
    });

    expect(updatedWarehouse?.name).toBe(`Warehouse Updated ${newTimestamp}`);
    expect(updatedWarehouse?.description).toBe('Updated description');
    expect(updatedWarehouse?.isActive).toBe(false);
  });

  it('should return 404 for non-existent warehouse', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .patch('/v1/warehouses/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(404);
  });
});
