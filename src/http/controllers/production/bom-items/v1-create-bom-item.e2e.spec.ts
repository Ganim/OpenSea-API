import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Bom Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a bom item', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a BOM first
    const bomResponse = await request(app.server)
      .post('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: `product-bomitem-${ts}`,
        name: `BOM for Item Test ${ts}`,
      });

    const bomId = bomResponse.body.bom.id;

    const response = await request(app.server)
      .post(`/v1/production/boms/${bomId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        materialId: `material-${ts}`,
        sequence: 1,
        quantity: 5.5,
        unit: 'kg',
        wastagePercent: 2.5,
        isOptional: false,
        notes: 'Test bom item notes',
      });

    expect(response.status).toBe(201);
    expect(response.body.bomItem).toEqual(
      expect.objectContaining({
        bomId,
        materialId: `material-${ts}`,
        sequence: 1,
        quantity: 5.5,
        unit: 'kg',
        isOptional: false,
        notes: 'Test bom item notes',
      }),
    );
    expect(response.body.bomItem.id).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/production/boms/00000000-0000-0000-0000-000000000000/items')
      .send({
        materialId: 'material-unauth',
        quantity: 1,
        unit: 'un',
      });

    expect(response.status).toBe(401);
  });
});
