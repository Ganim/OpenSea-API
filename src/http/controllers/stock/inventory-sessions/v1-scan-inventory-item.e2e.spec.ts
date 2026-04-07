import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createWarehouse } from '@/utils/tests/factories/stock/create-warehouse.e2e';

describe('Scan Inventory Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should scan an item in an open inventory session', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const { warehouseId } = await createWarehouse({ tenantId });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZS${String(timestamp).slice(-2)}`,
        name: `Zone Scan ${timestamp}`,
        warehouseId,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        tenantId,
        address: `SCN-${String(timestamp).slice(-4)}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const { item } = await createItemE2E({ tenantId, binId: bin.id });

    // Create a session
    const createResponse = await request(app.server)
      .post('/v1/stock/inventory-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'BIN', binId: bin.id });

    expect(createResponse.status).toBe(201);
    const sessionId = createResponse.body.session.id;

    // Scan the item using its fullCode
    const response = await request(app.server)
      .post(`/v1/stock/inventory-sessions/${sessionId}/scan`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: item.fullCode });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('session');
    expect(response.body).toHaveProperty('sessionItem');
    expect(response.body).toHaveProperty('scanResult');
    expect(response.body.session.id).toBe(sessionId);
    expect(['CONFIRMED', 'WRONG_BIN', 'EXTRA']).toContain(
      response.body.scanResult,
    );
    expect(response.body.sessionItem.itemId).toBeDefined();
    expect(response.body.sessionItem.status).toBeDefined();
  });

  it('should return 404 for non-existent session', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/stock/inventory-sessions/00000000-0000-0000-0000-000000000000/scan',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'NONEXISTENT' });

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post(
        '/v1/stock/inventory-sessions/00000000-0000-0000-0000-000000000000/scan',
      )
      .send({ code: 'TEST' });

    expect(response.status).toBe(401);
  });
});
