import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Bom Items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list bom items', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a BOM first
    const bomResponse = await request(app.server)
      .post('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: `product-listitems-${ts}`,
        name: `BOM for List Items ${ts}`,
      });

    const bomId = bomResponse.body.bom.id;

    // Create a BOM item
    await request(app.server)
      .post(`/v1/production/boms/${bomId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        materialId: `material-list-${ts}`,
        sequence: 1,
        quantity: 3,
        unit: 'un',
      });

    const response = await request(app.server)
      .get(`/v1/production/boms/${bomId}/items`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.bomItems).toBeInstanceOf(Array);
    expect(response.body.bomItems.length).toBeGreaterThanOrEqual(1);
    expect(response.body.bomItems[0]).toHaveProperty('id');
    expect(response.body.bomItems[0]).toHaveProperty('bomId');
    expect(response.body.bomItems[0]).toHaveProperty('materialId');
    expect(response.body.bomItems[0]).toHaveProperty('quantity');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/production/boms/00000000-0000-0000-0000-000000000000/items',
    );

    expect(response.status).toBe(401);
  });
});
