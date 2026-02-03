import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { Prisma } from '@prisma/generated/client.js';

describe('Get Zone by ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should retrieve a zone by ID with warehouse info', async () => {
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
      },
    });

    const response = await request(app.server)
      .get(`/v1/zones/${zone.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.zone).toMatchObject({
      id: zone.id,
      code: `Z${timestamp.slice(-3)}`,
      name: `Zone ${timestamp}`,
      warehouseId: warehouse.id,
    });
    expect(response.body.zone.structure).toBeDefined();
    expect(response.body.zone.totalBins).toBe(40); // 2 aisles * 5 shelves * 4 bins
    expect(response.body.warehouse).toMatchObject({
      id: warehouse.id,
      code: `W${timestamp.slice(-4)}`,
    });
  });
});
