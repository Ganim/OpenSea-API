import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Bom Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should delete a bom item', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a BOM first
    const bomResponse = await request(app.server)
      .post('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: `product-delitem-${ts}`,
        name: `BOM for Delete Item ${ts}`,
      });

    const bomId = bomResponse.body.bom.id;

    // Create a BOM item
    const itemResponse = await request(app.server)
      .post(`/v1/production/boms/${bomId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        materialId: `material-del-${ts}`,
        sequence: 1,
        quantity: 3,
        unit: 'un',
      });

    const itemId = itemResponse.body.bomItem.id;

    const response = await request(app.server)
      .delete(`/v1/production/boms/${bomId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).delete(
      '/v1/production/boms/00000000-0000-0000-0000-000000000000/items/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
