import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Routing Rule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a routing rule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/lead-routing/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Routing Rule ${timestamp}`,
        strategy: 'ROUND_ROBIN',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('routingRule');
    expect(response.body.routingRule).toHaveProperty('name');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/lead-routing/rules')
      .send({ name: 'No Auth', strategy: 'ROUND_ROBIN' });

    expect(response.status).toBe(401);
  });
});
