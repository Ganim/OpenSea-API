import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Zone (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new zone successfully', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
      },
    });

    const response = await request(app.server)
      .post('/v1/zones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        warehouseId: warehouse.id,
        code: `Z${timestamp.slice(-3)}`,
        name: `Zone ${timestamp}`,
        description: 'Test zone',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.zone).toMatchObject({
      code: `Z${timestamp.slice(-3)}`,
      name: `Zone ${timestamp}`,
      description: 'Test zone',
      isActive: true,
    });
    expect(response.body.zone.id).toBeDefined();

    const createdZone = await prisma.zone.findUnique({
      where: { id: response.body.zone.id },
    });

    expect(createdZone).toBeDefined();
    expect(createdZone?.code).toBe(`Z${timestamp.slice(-3)}`);
  });
});
