import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Validate Address (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should validate existing address with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `V${timestamp.slice(-3)}`,
        name: `Warehouse Validate ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZV${timestamp.slice(-2)}`,
        name: `Zone Validate ${timestamp}`,
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
      .get(`/v1/address/validate/${bin.address}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('valid');
    expect(response.body).toHaveProperty('exists');
    expect(response.body).toHaveProperty('address', bin.address);
  });

  it('should not validate address without auth token', async () => {
    const response = await request(app.server).get(
      '/v1/address/validate/FAB-EST-102-B',
    );

    expect(response.status).toBe(401);
  });
});
