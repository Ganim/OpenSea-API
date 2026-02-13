import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Suggest Address (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should suggest addresses with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `S${timestamp.slice(-3)}`,
        name: `Warehouse Suggest ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZS${timestamp.slice(-2)}`,
        name: `Zone Suggest ${timestamp}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    await prisma.bin.create({
      data: {
        tenantId,
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const response = await request(app.server)
      .post('/v1/address/suggest')
      .set('Authorization', `Bearer ${token}`)
      .send({
        partial: warehouse.code,
        limit: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('suggestions');
    expect(response.body).toHaveProperty('query');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.suggestions)).toBe(true);
  });

  it('should not suggest addresses without auth token', async () => {
    const response = await request(app.server)
      .post('/v1/address/suggest')
      .send({
        partial: 'FAB',
        limit: 5,
      });

    expect([400, 401]).toContain(response.status);
  });
});
