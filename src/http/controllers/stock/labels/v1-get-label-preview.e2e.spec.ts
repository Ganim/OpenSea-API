import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Label Preview (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get label preview with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `K${timestamp.slice(-3)}`,
        name: `Warehouse Preview ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZK${timestamp.slice(-2)}`,
        name: `Zone Preview ${timestamp}`,
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
      .get(`/v1/labels/preview/${bin.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('binId', bin.id);
    expect(response.body).toHaveProperty('address');
    expect(response.body).toHaveProperty('warehouseCode');
    expect(response.body).toHaveProperty('zoneCode');
    expect(response.body).toHaveProperty('codeData');
  });

  it('should not get label preview without auth token', async () => {
    const response = await request(app.server).get(
      '/v1/labels/preview/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
