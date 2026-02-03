import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import type { Prisma } from '@prisma/generated/client.js';

describe('Preview Zone Structure (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should preview zone structure with sample bins without persisting', async () => {
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
        structure:
          ZoneStructure.empty().toJSON() as unknown as Prisma.InputJsonValue,
      },
    });

    const response = await request(app.server)
      .post(`/v1/zones/${zone.id}/structure/preview`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        structure: {
          aisles: 3,
          shelvesPerAisle: 5,
          binsPerShelf: 4,
          aisleConfigs: [],
          dimensions: {},
        },
      });

    if (response.status !== 200) {
      console.error('Response error:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.totalBins).toBe(60); // 3 aisles * 5 shelves * 4 bins
    expect(response.body.totalShelves).toBe(15); // 3 aisles * 5 shelves
    expect(response.body.totalAisles).toBe(3);
    expect(response.body.sampleBins).toBeDefined();
    expect(Array.isArray(response.body.sampleBins)).toBe(true);
    expect(response.body.sampleBins.length).toBeGreaterThan(0);

    // Verify bins were NOT created in database
    const binCount = await prisma.bin.count({
      where: { zoneId: zone.id },
    });

    expect(binCount).toBe(0);
  });
});
