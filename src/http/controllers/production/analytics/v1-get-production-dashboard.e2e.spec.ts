import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Get Production Dashboard (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    // Create some production data so dashboard has metrics
    await createProductionTestData({ tenantId, userId });
  });

  it('should get production dashboard metrics', async () => {
    const response = await request(app.server)
      .get('/v1/production/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('orderCounts');
    expect(response.body).toHaveProperty('totalOrders');
    expect(response.body).toHaveProperty('activeOrders');
    expect(typeof response.body.totalOrders).toBe('number');
    expect(typeof response.body.activeOrders).toBe('number');
  });
});
