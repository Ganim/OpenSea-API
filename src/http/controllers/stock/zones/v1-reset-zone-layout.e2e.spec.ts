import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneLayout } from '@/entities/stock/value-objects/zone-layout';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { Prisma } from '@prisma/generated/client.js';

describe('Reset Zone Layout (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reset zone layout to automatic', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const tenant = await prisma.tenant.create({
      data: {
        name: `tenant-${timestamp}`,
        slug: `tenant-${timestamp}`,
        status: 'ACTIVE',
      },
    });
    const tenantId = tenant.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
      },
    });

    const layout = ZoneLayout.create({
      aislePositions: [
        { aisleNumber: 1, x: 0, y: 0, rotation: 0 },
        { aisleNumber: 2, x: 200, y: 0, rotation: 0 },
      ],
      canvasWidth: 500,
      canvasHeight: 400,
      gridSize: 10,
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        code: `Z${timestamp.slice(-3)}`,
        name: `Zone ${timestamp}`,
        structure: ZoneStructure.create({
          aisles: 2,
          shelvesPerAisle: 5,
          binsPerShelf: 4,
        }).toJSON() as unknown as Prisma.InputJsonValue,
        layout: layout.toJSON() as unknown as Prisma.InputJsonValue,
      },
    });

    expect(zone.layout).toBeDefined();

    const response = await request(app.server)
      .post(`/v1/zones/${zone.id}/layout/reset`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.zone.layout).toBeNull();

    const resetZone = await prisma.zone.findUnique({
      where: { id: zone.id },
    });

    expect(resetZone?.layout).toBeNull();
  });
});
