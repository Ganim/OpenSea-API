import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { Prisma } from '@prisma/generated/client.js';

describe('Configure Zone Structure (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should persist aisleConfigs and generate bins per aisle', async () => {
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
        structure:
          ZoneStructure.empty().toJSON() as unknown as Prisma.InputJsonValue,
      },
    });

    const response = await request(app.server)
      .post(`/v1/zones/${zone.id}/structure`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        structure: {
          aisles: 2,
          shelvesPerAisle: 10,
          binsPerShelf: 5,
          aisleConfigs: [
            { aisleNumber: 1, shelvesCount: 10, binsPerShelf: 5 },
            { aisleNumber: 2, shelvesCount: 3, binsPerShelf: 2 },
          ],
          codePattern: {
            separator: '-',
            aisleDigits: 1,
            shelfDigits: 2,
            binLabeling: 'LETTERS',
            binDirection: 'BOTTOM_UP',
          },
          dimensions: {
            aisleWidth: 120,
            aisleSpacing: 30,
            shelfWidth: 80,
            shelfHeight: 200,
            binHeight: 20,
          },
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.zone.structure.aisleConfigs).toHaveLength(2);
    expect(response.body.binsCreated).toBe(56);

    const binCount = await prisma.bin.count({
      where: { zoneId: zone.id, deletedAt: null },
    });

    expect(binCount).toBe(56);

    const persistedZone = await prisma.zone.findUnique({
      where: { id: zone.id },
    });
    expect(persistedZone?.structure).toMatchObject({
      aisleConfigs: [
        { aisleNumber: 1, shelvesCount: 10, binsPerShelf: 5 },
        { aisleNumber: 2, shelvesCount: 3, binsPerShelf: 2 },
      ],
    });
  });
});
