import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Scoring Rule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should delete a scoring rule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales/lead-scoring/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Delete Scoring ${timestamp}`,
        field: 'revenue',
        condition: 'greater_than',
        value: '5000',
        points: 5,
      });

    const ruleId = createResponse.body.scoringRule.id;

    const response = await request(app.server)
      .delete(`/v1/sales/lead-scoring/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/sales/lead-scoring/rules/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
