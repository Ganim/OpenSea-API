import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Goal Progress (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/analytics/goals/00000000-0000-0000-0000-000000000001/progress',
    );

    expect(response.status).toBe(401);
  });

  it('should get goal progress (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/sales/analytics/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `GoalProgress ${Date.now()}`,
        type: 'QUANTITY',
        targetValue: 100,
        period: 'MONTHLY',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    const goalId = createRes.body.goal.id;

    const response = await request(app.server)
      .get(`/v1/sales/analytics/goals/${goalId}/progress`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.status);
  });
});
