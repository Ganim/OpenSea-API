import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Warehouses (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list all warehouses', async () => {
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

    await prisma.warehouse.create({
      data: {
        tenantId,
        code: `L1${timestamp.slice(-3)}`,
        name: `Warehouse List 1 ${timestamp}`,
        isActive: true,
      },
    });

    await prisma.warehouse.create({
      data: {
        tenantId,
        code: `L2${timestamp.slice(-3)}`,
        name: `Warehouse List 2 ${timestamp}`,
        isActive: false,
      },
    });

    const response = await request(app.server)
      .get('/v1/warehouses')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('warehouses');
    expect(Array.isArray(response.body.warehouses)).toBe(true);
    expect(response.body.warehouses.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter active-only warehouses', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/warehouses')
      .query({ activeOnly: true })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('warehouses');

    for (const warehouse of response.body.warehouses) {
      expect(warehouse.isActive).toBe(true);
    }
  });
});
