import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Campaign (E2E)', () => {
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
      .post('/v1/campaigns')
      .send({ name: 'Test Campaign' });

    expect(response.status).toBe(401);
  });

  it('should create a campaign (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Campaign E2E ${timestamp}`,
        type: 'PERCENTAGE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('campaign');
    expect(response.body.campaign).toHaveProperty('id');
    expect(response.body.campaign.name).toBe(`Campaign E2E ${timestamp}`);
  });
});
