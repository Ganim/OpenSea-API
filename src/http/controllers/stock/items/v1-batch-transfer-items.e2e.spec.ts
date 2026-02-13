import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';

describe('Batch Transfer Items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should batch transfer items to destination bin', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    // Source warehouse + zone + bin
    const sourceWarehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `S${timestamp.toString().slice(-3)}`,
        name: 'Source warehouse',
      },
    });

    const sourceZone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZS${timestamp.toString().slice(-2)}`,
        name: 'Source zone',
        warehouseId: sourceWarehouse.id,
        structure: {},
      },
    });

    const sourceBin = await prisma.bin.create({
      data: {
        tenantId,
        address: `${sourceWarehouse.code}-${sourceZone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: sourceZone.id,
      },
    });

    // Destination warehouse + zone + bin
    const destWarehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `D${timestamp.toString().slice(-3)}`,
        name: 'Dest warehouse',
      },
    });

    const destZone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZD${timestamp.toString().slice(-2)}`,
        name: 'Dest zone',
        warehouseId: destWarehouse.id,
        structure: {},
      },
    });

    const destBin = await prisma.bin.create({
      data: {
        tenantId,
        address: `${destWarehouse.code}-${destZone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: destZone.id,
      },
    });

    // Create two items in source bin
    const { item: item1 } = await createItemE2E({
      tenantId,
      uniqueCode: `ITEM-BT1-${timestamp}`,
      binId: sourceBin.id,
      initialQuantity: 10,
      status: 'AVAILABLE',
      attributes: {},
      entryDate: new Date(),
    });

    const { item: item2 } = await createItemE2E({
      tenantId,
      uniqueCode: `ITEM-BT2-${timestamp}`,
      binId: sourceBin.id,
      initialQuantity: 5,
      status: 'AVAILABLE',
      attributes: {},
      entryDate: new Date(),
    });

    const response = await request(app.server)
      .post('/v1/items/batch-transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemIds: [item1.id, item2.id],
        destinationBinId: destBin.id,
        notes: 'Batch relocation test',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('transferred', 2);
    expect(response.body).toHaveProperty('movements');
    expect(response.body.movements).toHaveLength(2);
  });

  it('should return 404 for non-existent destination bin', async () => {
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
      uniqueCode: `ITEM-BT404-${timestamp}`,
      binId: bin.id,
      initialQuantity: 10,
      status: 'AVAILABLE',
      attributes: {},
      entryDate: new Date(),
    });

    const response = await request(app.server)
      .post('/v1/items/batch-transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemIds: [item.id],
        destinationBinId: '00000000-0000-0000-0000-000000000000',
      });

    expect([400, 404]).toContain(response.status);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/items/batch-transfer')
      .send({
        itemIds: ['00000000-0000-0000-0000-000000000001'],
        destinationBinId: '00000000-0000-0000-0000-000000000002',
      });

    expect([400, 401]).toContain(response.status);
  });
});
