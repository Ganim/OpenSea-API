import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Boms (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list boms', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a BOM via API first
    await request(app.server)
      .post('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: `product-list-${ts}`,
        name: `BOM List Test ${ts}`,
      });

    const response = await request(app.server)
      .get('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.boms).toBeInstanceOf(Array);
    expect(response.body.boms.length).toBeGreaterThanOrEqual(1);
    expect(response.body.boms[0]).toHaveProperty('id');
    expect(response.body.boms[0]).toHaveProperty('name');
    expect(response.body.boms[0]).toHaveProperty('status');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/v1/production/boms');

    expect(response.status).toBe(401);
  });
});
