import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Zone Item Stats (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return zone item statistics', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        code: `Z${timestamp.slice(-3)}`,
        name: `Zone ${timestamp}`,
        structure: {},
      },
    });

    // Create 4 bins directly (1 aisle * 2 shelves * 2 bins)
    const binData = [
      { aisle: 1, shelf: 1, position: 'A' },
      { aisle: 1, shelf: 1, position: 'B' },
      { aisle: 1, shelf: 2, position: 'A' },
      { aisle: 1, shelf: 2, position: 'B' },
    ];

    for (const b of binData) {
      await prisma.bin.create({
        data: {
          tenantId,
          zoneId: zone.id,
          address: `${warehouse.code}-${zone.code}-${String(b.aisle).padStart(2, '0')}-${String(b.shelf).padStart(2, '0')}-${b.position}`,
          aisle: b.aisle,
          shelf: b.shelf,
          position: b.position,
        },
      });
    }

    const response = await request(app.server)
      .get(`/v1/zones/${zone.id}/item-stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalBins');
    expect(response.body).toHaveProperty('activeBins');
    expect(response.body).toHaveProperty('blockedBins');
    expect(response.body).toHaveProperty('occupiedBins');
    expect(response.body).toHaveProperty('totalItems');
    expect(response.body).toHaveProperty('itemsInBlockedBins');
    expect(response.body.totalBins).toBe(4);
    expect(response.body.occupiedBins).toBe(0);
    expect(response.body.totalItems).toBe(0);
  });

  it('should return 404 for non-existent zone', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/zones/00000000-0000-0000-0000-000000000000/item-stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/zones/00000000-0000-0000-0000-000000000000/item-stats',
    );

    expect(response.status).toBe(401);
  });
});
