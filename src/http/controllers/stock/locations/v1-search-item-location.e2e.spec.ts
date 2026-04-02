import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createWarehouse } from '@/utils/tests/factories/stock/create-warehouse.e2e';

describe('Search Item Location (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should search items by query and return location info', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const { warehouseId } = await createWarehouse({ tenantId });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `SL${String(timestamp).slice(-2)}`,
        name: `Zone Search ${timestamp}`,
        warehouseId,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        tenantId,
        address: `SRC-${String(timestamp).slice(-4)}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const { product } = await createItemE2E({ tenantId, binId: bin.id });

    // Search using the product name
    const response = await request(app.server)
      .get('/v1/items/search-location')
      .set('Authorization', `Bearer ${token}`)
      .query({ q: product.name.substring(0, 10) });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('should return empty array for non-matching query', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/items/search-location')
      .set('Authorization', `Bearer ${token}`)
      .query({ q: 'ZZNONEXISTENT999' });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(0);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .get('/v1/items/search-location')
      .query({ q: 'test' });

    expect(response.status).toBe(401);
  });
});
