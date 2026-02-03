import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import type { Prisma } from '@prisma/generated/client.js';

describe('Delete Zone (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete a zone and soft delete its bins', async () => {
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
        structure: ZoneStructure.create({
          aisles: 1,
          shelvesPerAisle: 2,
          binsPerShelf: 2,
        }).toJSON() as unknown as Prisma.InputJsonValue,
      },
    });

    // Manually create 2 bins (the full zone would have 4 bins: 1 aisle * 2 shelves * 2 bins)
    // But we only create 2 to test that the delete operation handles multiple bins
    await prisma.bin.createMany({
      data: [
        {
          tenantId,
          zoneId: zone.id,
          address: '1-1-A',
          aisle: 1,
          shelf: 1,
          position: 'A',
        },
        {
          tenantId,
          zoneId: zone.id,
          address: '1-1-B',
          aisle: 1,
          shelf: 1,
          position: 'B',
        },
      ],
    });

    const response = await request(app.server)
      .delete(`/v1/zones/${zone.id}`)
      .set('Authorization', `Bearer ${token}`)
      .query({ forceDeleteBins: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.deletedBinsCount).toBe(2); // We manually created 2 bins

    const deletedZone = await prisma.zone.findUnique({
      where: { id: zone.id },
    });

    expect(deletedZone?.deletedAt).not.toBeNull();

    const softDeletedBins = await prisma.bin.findMany({
      where: {
        zoneId: zone.id,
        deletedAt: { not: null },
      },
    });

    expect(softDeletedBins.length).toBeGreaterThan(0);
  });
});
