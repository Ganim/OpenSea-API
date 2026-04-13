import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Release Quality Hold (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let qualityHoldId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });

    // Create an active quality hold
    const qualityHold = await prisma.productionQualityHold.create({
      data: {
        productionOrderId: data.productionOrder.id,
        reason: 'Quality hold to be released',
        status: 'ACTIVE',
        holdById: userId,
      },
    });
    qualityHoldId = qualityHold.id;
  });

  it('should release a quality hold', async () => {
    const response = await request(app.server)
      .patch(`/v1/production/quality-holds/${qualityHoldId}/release`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        resolution: 'Issue resolved after re-inspection',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('qualityHold');
    expect(response.body.qualityHold.id).toBe(qualityHoldId);
    expect(response.body.qualityHold.status).toBe('RELEASED');
    expect(response.body.qualityHold.resolution).toBe(
      'Issue resolved after re-inspection',
    );
    expect(response.body.qualityHold.releasedById).toBeTruthy();
    expect(response.body.qualityHold.releasedAt).toBeTruthy();
  });
});
