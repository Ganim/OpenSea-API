import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Generate Labels By Zone (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate labels by zone with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `H${timestamp.slice(-3)}`,
        name: `Warehouse LabelZone ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZH${timestamp.slice(-2)}`,
        name: `Zone LabelZone ${timestamp}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    await prisma.bin.create({
      data: {
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const response = await request(app.server)
      .post('/v1/labels/generate-by-zone')
      .set('Authorization', `Bearer ${token}`)
      .send({
        zoneId: zone.id,
        format: 'qr',
        size: 'medium',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('labels');
    expect(response.body).toHaveProperty('format');
    expect(response.body).toHaveProperty('size');
    expect(response.body).toHaveProperty('totalLabels');
    expect(Array.isArray(response.body.labels)).toBe(true);
  });

  it('should not generate labels by zone without auth token', async () => {
    const response = await request(app.server)
      .post('/v1/labels/generate-by-zone')
      .send({
        zoneId: '00000000-0000-0000-0000-000000000000',
        format: 'qr',
        size: 'medium',
      });

    expect(response.status).toBe(401);
  });
});
