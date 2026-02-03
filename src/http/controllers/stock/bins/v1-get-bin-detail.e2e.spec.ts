import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Bin Detail (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get bin detail with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `D${timestamp.slice(-3)}`,
        name: `Warehouse Detail ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZD${timestamp.slice(-2)}`,
        name: `Zone Detail ${timestamp}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        tenantId,
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const response = await request(app.server)
      .get(`/v1/bins/${bin.id}/detail`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bin');
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('zone');
    expect(response.body).toHaveProperty('warehouse');
    expect(response.body.bin).toHaveProperty('id', bin.id);
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('should not get bin detail without auth token', async () => {
    const response = await request(app.server).get(
      '/v1/bins/00000000-0000-0000-0000-000000000000/detail',
    );

    expect(response.status).toBe(401);
  });
});
