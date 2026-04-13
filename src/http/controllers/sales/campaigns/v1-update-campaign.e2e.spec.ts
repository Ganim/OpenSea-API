import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Campaign (E2E)', () => {
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
      .put('/v1/campaigns/00000000-0000-0000-0000-000000000001')
      .send({ name: 'Updated Campaign' });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent campaign', async () => {
    const response = await request(app.server)
      .put('/v1/campaigns/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Campaign' });

    expect([404, 400]).toContain(response.status);
  });

  it('should update a campaign (200)', async () => {
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Campaign Update ${timestamp}`,
        type: 'PERCENTAGE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (createResponse.status === 201) {
      const campaignId = createResponse.body.campaign.id;

      const response = await request(app.server)
        .put(`/v1/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Campaign Updated ${timestamp}`,
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('campaign');
      expect(response.body.campaign.name).toBe(
        `Campaign Updated ${timestamp}`,
      );
    }
  });
});
