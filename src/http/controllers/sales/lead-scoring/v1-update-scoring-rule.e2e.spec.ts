import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Scoring Rule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a scoring rule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales/lead-scoring/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Update Scoring ${timestamp}`,
        field: 'revenue',
        condition: 'greater_than',
        value: '5000',
        points: 5,
      });

    const ruleId = createResponse.body.scoringRule.id;

    const response = await request(app.server)
      .patch(`/v1/sales/lead-scoring/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ points: 15 });

    expect(response.status).toBe(200);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/sales/lead-scoring/rules/00000000-0000-0000-0000-000000000000',
      )
      .send({ points: 15 });

    expect(response.status).toBe(401);
  });
});
