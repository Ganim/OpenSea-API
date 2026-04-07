import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createWarehouse } from '@/utils/tests/factories/stock/create-warehouse.e2e';

describe('Create Inventory Session (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a BIN inventory session', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const { warehouseId } = await createWarehouse({ tenantId });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZI${String(timestamp).slice(-2)}`,
        name: `Zone Inv ${timestamp}`,
        warehouseId,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        tenantId,
        address: `INV-${String(timestamp).slice(-4)}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    // Create an item in this bin
    await createItemE2E({ tenantId, binId: bin.id });

    const response = await request(app.server)
      .post('/v1/stock/inventory-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mode: 'BIN',
        binId: bin.id,
        notes: 'Test inventory session',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toMatchObject({
      status: 'OPEN',
      mode: 'BIN',
      notes: 'Test inventory session',
    });
    expect(response.body.session.id).toBeDefined();
    expect(response.body.session.totalItems).toBeGreaterThanOrEqual(0);
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/stock/inventory-sessions')
      .send({
        mode: 'BIN',
        notes: 'No auth',
      });

    expect(response.status).toBe(401);
  });
});
