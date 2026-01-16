import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { Prisma } from '@prisma/client';

describe('Update Zone (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update zone details successfully', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        warehouseId: warehouse.id,
        code: `Z${timestamp.slice(-3)}`,
        name: `Zone ${timestamp}`,
        description: 'Original description',
        isActive: true,
        structure:
          ZoneStructure.empty().toJSON() as unknown as Prisma.InputJsonValue,
      },
    });

    const newTimestamp = Date.now().toString();
    const response = await request(app.server)
      .patch(`/v1/zones/${zone.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `Z${newTimestamp.slice(-3)}`,
        name: `Zone Updated ${newTimestamp}`,
        description: 'Updated description',
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.zone).toMatchObject({
      id: zone.id,
      code: `Z${newTimestamp.slice(-3)}`,
      name: `Zone Updated ${newTimestamp}`,
      description: 'Updated description',
      isActive: false,
    });

    const updatedZone = await prisma.zone.findUnique({
      where: { id: zone.id },
    });

    expect(updatedZone?.name).toBe(`Zone Updated ${newTimestamp}`);
    expect(updatedZone?.description).toBe('Updated description');
    expect(updatedZone?.isActive).toBe(false);
  });
});
