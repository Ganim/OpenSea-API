import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Goal (E2E)', () => {
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
    const response = await request(app.server)
      .patch('/v1/sales/analytics/goals/00000000-0000-0000-0000-000000000001')
      .send({ name: 'Updated Goal' });

    expect(response.status).toBe(401);
  });

  it('should update a goal (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/sales/analytics/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `UpdGoal ${Date.now()}`,
        type: 'REVENUE',
        targetValue: 10000,
        period: 'WEEKLY',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    const goalId = createRes.body.goal.id;

    const response = await request(app.server)
      .patch(`/v1/sales/analytics/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Updated Goal ${Date.now()}`, targetValue: 20000 });

    expect(response.status).toBe(200);
    expect(response.body.goal).toBeDefined();
  });
});
