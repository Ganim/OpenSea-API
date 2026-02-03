import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Warehouse by ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should retrieve a warehouse by ID', async () => {
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
        description: 'Test description',
        address: 'Test address',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/warehouses/${warehouse.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('warehouse');
    expect(response.body.warehouse).toMatchObject({
      id: warehouse.id,
      code: `W${timestamp.slice(-4)}`,
      name: `Warehouse ${timestamp}`,
      description: 'Test description',
      address: 'Test address',
      isActive: true,
    });
  });

  it('should return 404 for non-existent warehouse', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/warehouses/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
