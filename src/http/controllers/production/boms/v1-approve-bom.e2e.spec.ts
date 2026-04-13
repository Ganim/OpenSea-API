import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Approve Bom (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should approve a bom', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a BOM first (starts as DRAFT)
    const createResponse = await request(app.server)
      .post('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: `product-approve-${ts}`,
        name: `BOM Approve Test ${ts}`,
      });

    const bomId = createResponse.body.bom.id;
    expect(createResponse.body.bom.status).toBe('DRAFT');

    const response = await request(app.server)
      .post(`/v1/production/boms/${bomId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.bom).toEqual(
      expect.objectContaining({
        id: bomId,
        status: 'ACTIVE',
      }),
    );
    expect(response.body.bom.approvedById).toBeDefined();
    expect(response.body.bom.approvedAt).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).post(
      '/v1/production/boms/00000000-0000-0000-0000-000000000000/approve',
    );

    expect(response.status).toBe(401);
  });
});
