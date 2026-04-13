import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Bom Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update a bom item', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a BOM first
    const bomResponse = await request(app.server)
      .post('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: `product-upditem-${ts}`,
        name: `BOM for Update Item ${ts}`,
      });

    const bomId = bomResponse.body.bom.id;

    // Create a BOM item
    const itemResponse = await request(app.server)
      .post(`/v1/production/boms/${bomId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        materialId: `material-upd-${ts}`,
        sequence: 1,
        quantity: 3,
        unit: 'un',
      });

    const itemId = itemResponse.body.bomItem.id;

    const response = await request(app.server)
      .put(`/v1/production/boms/${bomId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        quantity: 10,
        unit: 'kg',
        wastagePercent: 5,
        notes: 'Updated notes',
      });

    expect(response.status).toBe(200);
    expect(response.body.bomItem).toEqual(
      expect.objectContaining({
        id: itemId,
        quantity: 10,
        unit: 'kg',
        notes: 'Updated notes',
      }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .put(
        '/v1/production/boms/00000000-0000-0000-0000-000000000000/items/00000000-0000-0000-0000-000000000000',
      )
      .send({ quantity: 1 });

    expect(response.status).toBe(401);
  });
});
