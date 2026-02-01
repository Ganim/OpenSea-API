import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Search Bins (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should search bins with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `Q${timestamp.slice(-3)}`,
        name: `Warehouse Search ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZQ${timestamp.slice(-2)}`,
        name: `Zone Search ${timestamp}`,
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
      .get('/v1/bins/search')
      .query({ q: warehouse.code })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bins');
    expect(Array.isArray(response.body.bins)).toBe(true);
  });

  it('should not search bins without auth token', async () => {
    const response = await request(app.server)
      .get('/v1/bins/search')
      .query({ q: 'FAB' });

    expect(response.status).toBe(401);
  });
});
