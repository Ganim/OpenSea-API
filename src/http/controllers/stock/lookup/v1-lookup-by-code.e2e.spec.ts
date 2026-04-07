import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createWarehouse } from '@/utils/tests/factories/stock/create-warehouse.e2e';

describe('Lookup by Code (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should lookup an item by its fullCode', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const { warehouseId } = await createWarehouse({ tenantId });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZK${String(timestamp).slice(-2)}`,
        name: `Zone Lookup ${timestamp}`,
        warehouseId,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        tenantId,
        address: `LKP-${String(timestamp).slice(-4)}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const { item } = await createItemE2E({ tenantId, binId: bin.id });

    const response = await request(app.server)
      .get(`/v1/stock/lookup/${encodeURIComponent(item.fullCode)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('entityType');
    expect(response.body).toHaveProperty('entityId');
    expect(response.body).toHaveProperty('entity');
    expect(response.body.entityType).toBe('ITEM');
    expect(response.body.entityId).toBe(item.id);
  });

  it('should lookup a bin by its address', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const { warehouseId } = await createWarehouse({ tenantId });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZB${String(timestamp).slice(-2)}`,
        name: `Zone BinLookup ${timestamp}`,
        warehouseId,
        structure: {},
      },
    });

    const binAddress = `BLK-${String(timestamp).slice(-4)}-01-A`;
    await prisma.bin.create({
      data: {
        tenantId,
        address: binAddress,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const response = await request(app.server)
      .get(`/v1/stock/lookup/${encodeURIComponent(binAddress)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.entityType).toBe('BIN');
  });

  it('should return 404 for non-existent code', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/stock/lookup/NONEXISTENT-CODE-99999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/stock/lookup/SOME-CODE',
    );

    expect(response.status).toBe(401);
  });
});
