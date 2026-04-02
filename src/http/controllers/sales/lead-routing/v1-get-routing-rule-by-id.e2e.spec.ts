import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Routing Rule By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get routing rule by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales/lead-routing/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Get Rule ${timestamp}`,
        strategy: 'ROUND_ROBIN',
      });

    const ruleId = createResponse.body.routingRule.id;

    const response = await request(app.server)
      .get(`/v1/sales/lead-routing/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('routingRule');
    expect(response.body.routingRule.id).toBe(ruleId);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/lead-routing/rules/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
