import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { Prisma } from '@prisma/generated/client.js';

describe('List Zones (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list all zones for a warehouse', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
      },
    });

    await prisma.zone.create({
      data: {
        warehouseId: warehouse.id,
        code: `Z1${timestamp.slice(-2)}`,
        name: `Zone 1 ${timestamp}`,
        structure:
          ZoneStructure.empty().toJSON() as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.zone.create({
      data: {
        warehouseId: warehouse.id,
        code: `Z2${timestamp.slice(-2)}`,
        name: `Zone 2 ${timestamp}`,
        structure:
          ZoneStructure.empty().toJSON() as unknown as Prisma.InputJsonValue,
      },
    });

    const response = await request(app.server)
      .get('/v1/zones')
      .query({ warehouseId: warehouse.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.zones).toHaveLength(2);
    expect(response.body.zones[0]).toMatchObject({
      code: `Z1${timestamp.slice(-2)}`,
      warehouseId: warehouse.id,
    });
    expect(response.body.zones[1]).toMatchObject({
      code: `Z2${timestamp.slice(-2)}`,
      warehouseId: warehouse.id,
    });
  });
});
