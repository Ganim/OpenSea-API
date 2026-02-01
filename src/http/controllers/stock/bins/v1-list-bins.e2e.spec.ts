import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Bins (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list bins with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `LB${timestamp.slice(-3)}`,
        name: `Warehouse ListBins ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZL${timestamp.slice(-2)}`,
        name: `Zone ListBins ${timestamp}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    await prisma.bin.createMany({
      data: [
        {
          address: `${warehouse.code}-${zone.code}-01-A`,
          aisle: 1,
          shelf: 1,
          position: 'A',
          zoneId: zone.id,
        },
        {
          address: `${warehouse.code}-${zone.code}-01-B`,
          aisle: 1,
          shelf: 1,
          position: 'B',
          zoneId: zone.id,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/bins')
      .query({ zoneId: zone.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bins');
    expect(Array.isArray(response.body.bins)).toBe(true);
    expect(response.body.bins.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter bins by active status', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/bins')
      .query({ isActive: true })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bins');
    expect(Array.isArray(response.body.bins)).toBe(true);
  });
});
