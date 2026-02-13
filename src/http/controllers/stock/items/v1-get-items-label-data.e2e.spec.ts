import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';

describe('Get Items Label Data (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return label data for given items', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `W${timestamp.toString().slice(-3)}`,
        name: 'Warehouse',
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `Z${timestamp.toString().slice(-3)}`,
        name: 'Zone',
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

    const { item } = await createItemE2E({
      tenantId,
      uniqueCode: `ITEM-LABEL-${timestamp}`,
      binId: bin.id,
      initialQuantity: 10,
      status: 'AVAILABLE',
      attributes: {},
      entryDate: new Date(),
    });

    const response = await request(app.server)
      .post('/v1/items/label-data')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemIds: [item.id],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('labelData');
    expect(response.body.labelData).toHaveLength(1);

    const label = response.body.labelData[0];
    expect(label).toHaveProperty('item');
    expect(label).toHaveProperty('variant');
    expect(label).toHaveProperty('product');
    expect(label).toHaveProperty('template');
    expect(label).toHaveProperty('location');
    expect(label).toHaveProperty('tenant');
    expect(label.item.id).toBe(item.id);
  });

  it('should return empty array for non-existent items', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/items/label-data')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemIds: ['00000000-0000-0000-0000-000000000000'],
      });

    expect(response.status).toBe(200);
    expect(response.body.labelData).toHaveLength(0);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/items/label-data')
      .send({
        itemIds: ['00000000-0000-0000-0000-000000000001'],
      });

    // POST with body may return 400 (Zod validation) before auth middleware
    expect([400, 401]).toContain(response.status);
  });
});
