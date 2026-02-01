import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Bin by ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should retrieve a bin by ID with item count', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `G${timestamp.slice(-3)}`,
        name: `Warehouse GetBin ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZG${timestamp.slice(-2)}`,
        name: `Zone GetBin ${timestamp}`,
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
      .get(`/v1/bins/${bin.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bin');
    expect(response.body.bin).toMatchObject({
      id: bin.id,
      zoneId: zone.id,
      address: `${warehouse.code}-${zone.code}-01-A`,
      aisle: 1,
      shelf: 1,
      position: 'A',
    });
  });

  it('should return 404 for non-existent bin', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/bins/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
