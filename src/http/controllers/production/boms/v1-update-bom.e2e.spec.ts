import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Bom (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update a bom', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a BOM first
    const createResponse = await request(app.server)
      .post('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: `product-upd-${ts}`,
        name: `BOM Update Test ${ts}`,
      });

    const bomId = createResponse.body.bom.id;

    const response = await request(app.server)
      .put(`/v1/production/boms/${bomId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `BOM Updated ${ts}`,
        description: 'Updated description',
        isDefault: false,
        baseQuantity: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.bom).toEqual(
      expect.objectContaining({
        id: bomId,
        name: `BOM Updated ${ts}`,
        description: 'Updated description',
        isDefault: false,
      }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .put('/v1/production/boms/00000000-0000-0000-0000-000000000000')
      .send({ name: 'Unauthorized' });

    expect(response.status).toBe(401);
  });
});
