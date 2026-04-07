import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createWarehouse } from '@/utils/tests/factories/stock/create-warehouse.e2e';

describe('List Inventory Sessions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list inventory sessions with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const { warehouseId } = await createWarehouse({ tenantId });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZL${String(timestamp).slice(-2)}`,
        name: `Zone List ${timestamp}`,
        warehouseId,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        tenantId,
        address: `LST-${String(timestamp).slice(-4)}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    await createItemE2E({ tenantId, binId: bin.id });

    // Create a session so there's at least one
    await request(app.server)
      .post('/v1/stock/inventory-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'BIN', binId: bin.id });

    const response = await request(app.server)
      .get('/v1/stock/inventory-sessions')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 10,
    });
    expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('should filter sessions by status', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/stock/inventory-sessions')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'OPEN' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    if (response.body.data.length > 0) {
      for (const session of response.body.data) {
        expect(session.status).toBe('OPEN');
      }
    }
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/stock/inventory-sessions',
    );

    expect(response.status).toBe(401);
  });
});
