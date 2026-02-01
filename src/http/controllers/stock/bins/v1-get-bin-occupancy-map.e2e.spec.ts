import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Bin Occupancy Map (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get bin occupancy map with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `O${timestamp.slice(-3)}`,
        name: `Warehouse Occupancy ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZO${timestamp.slice(-2)}`,
        name: `Zone Occupancy ${timestamp}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    await prisma.bin.create({
      data: {
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const response = await request(app.server)
      .get('/v1/bins/occupancy')
      .query({ zoneId: zone.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('occupancyData');
    expect(response.body).toHaveProperty('stats');
    expect(Array.isArray(response.body.occupancyData)).toBe(true);
    expect(response.body.stats).toHaveProperty('totalBins');
    expect(response.body.stats).toHaveProperty('emptyBins');
  });

  it('should not get bin occupancy map without auth token', async () => {
    const response = await request(app.server)
      .get('/v1/bins/occupancy')
      .query({ zoneId: '00000000-0000-0000-0000-000000000000' });

    expect(response.status).toBe(401);
  });
});
