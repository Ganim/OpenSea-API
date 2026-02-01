import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Bin (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update bin capacity and status', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `UB${timestamp.slice(-3)}`,
        name: `Warehouse UpdateBin ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZU${timestamp.slice(-2)}`,
        name: `Zone UpdateBin ${timestamp}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
        capacity: 10,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/bins/${bin.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        capacity: 50,
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bin');
    expect(response.body.bin).toMatchObject({
      id: bin.id,
      capacity: 50,
      isActive: false,
    });

    const updatedBin = await prisma.bin.findUnique({
      where: { id: bin.id },
    });

    expect(updatedBin?.capacity).toBe(50);
    expect(updatedBin?.isActive).toBe(false);
  });

  it('should return 404 for non-existent bin', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .patch('/v1/bins/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        capacity: 50,
      });

    expect(response.status).toBe(404);
  });
});
