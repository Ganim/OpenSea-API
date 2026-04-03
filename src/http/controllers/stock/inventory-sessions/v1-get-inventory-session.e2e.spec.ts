import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createWarehouse } from '@/utils/tests/factories/stock/create-warehouse.e2e';

describe('Get Inventory Session (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should get an inventory session by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const { warehouseId } = await createWarehouse({ tenantId });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZG${String(timestamp).slice(-2)}`,
        name: `Zone Get ${timestamp}`,
        warehouseId,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        tenantId,
        address: `GET-${String(timestamp).slice(-4)}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    await createItemE2E({ tenantId, binId: bin.id });

    // Create a session first
    const createResponse = await request(app.server)
      .post('/v1/stock/inventory-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'BIN', binId: bin.id });

    expect(createResponse.status).toBe(201);
    const sessionId = createResponse.body.session.id;

    // Get the session
    const response = await request(app.server)
      .get(`/v1/stock/inventory-sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toMatchObject({
      id: sessionId,
      status: 'OPEN',
      mode: 'BIN',
    });
    expect(response.body.session.userId).toBeDefined();
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('should return 404 for non-existent session', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/stock/inventory-sessions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/stock/inventory-sessions/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
