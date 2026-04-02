import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Routing Rule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a routing rule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales/lead-routing/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Update Rule ${timestamp}`,
        strategy: 'ROUND_ROBIN',
      });

    const ruleId = createResponse.body.routingRule.id;

    const response = await request(app.server)
      .put(`/v1/sales/lead-routing/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Updated Rule ${timestamp}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('routingRule');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/sales/lead-routing/rules/00000000-0000-0000-0000-000000000000')
      .send({ name: 'No Auth' });

    expect(response.status).toBe(401);
  });
});
