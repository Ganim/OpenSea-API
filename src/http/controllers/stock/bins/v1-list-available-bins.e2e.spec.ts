import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Available Bins (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list available bins with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `L${timestamp.slice(-3)}`,
        name: `Warehouse Available ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZL${timestamp.slice(-2)}`,
        name: `Zone Available ${timestamp}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    await prisma.bin.create({
      data: {
        tenantId,
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
        isBlocked: false,
      },
    });

    const response = await request(app.server)
      .get('/v1/bins/available')
      .query({ zoneId: zone.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bins');
    expect(Array.isArray(response.body.bins)).toBe(true);
  });

  it('should not list available bins without auth token', async () => {
    const response = await request(app.server)
      .get('/v1/bins/available')
      .query({ zoneId: '00000000-0000-0000-0000-000000000000' });

    expect(response.status).toBe(401);
  });
});
