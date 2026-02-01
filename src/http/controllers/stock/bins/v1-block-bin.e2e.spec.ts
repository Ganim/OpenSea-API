import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Block Bin (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should block bin with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `B${timestamp.slice(-3)}`,
        name: `Warehouse Block ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZB${timestamp.slice(-2)}`,
        name: `Zone Block ${timestamp}`,
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
      },
    });

    const response = await request(app.server)
      .post(`/v1/bins/${bin.id}/block`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Maintenance required',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bin');
    expect(response.body.bin).toHaveProperty('id', bin.id);
    expect(response.body.bin).toHaveProperty('isBlocked', true);
  });

  it('should not block bin without auth token', async () => {
    const response = await request(app.server)
      .post('/v1/bins/00000000-0000-0000-0000-000000000000/block')
      .send({
        reason: 'Maintenance required',
      });

    expect(response.status).toBe(401);
  });
});
