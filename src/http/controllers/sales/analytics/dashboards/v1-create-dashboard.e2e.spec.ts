import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Dashboard (E2E)', () => {
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
      .post('/v1/sales/analytics/dashboards')
      .send({ name: 'Test Dashboard' });

    expect(response.status).toBe(401);
  });

  it('should create a dashboard (201)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/analytics/dashboards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Dashboard E2E ${Date.now()}`,
        description: 'Test dashboard',
        role: 'MANAGER',
        visibility: 'PRIVATE',
      });

    expect(response.status).toBe(201);
    expect(response.body.dashboard).toBeDefined();
    expect(response.body.dashboard).toHaveProperty('id');
  });
});
