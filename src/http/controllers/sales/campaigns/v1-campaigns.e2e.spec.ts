import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Campaigns (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/campaigns should create a campaign (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Campaign ${timestamp}`,
        type: 'PERCENTAGE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('campaign');
    expect(response.body.campaign).toHaveProperty('id');
    expect(response.body.campaign.name).toBe(`Campaign ${timestamp}`);
    expect(response.body.campaign.type).toBe('PERCENTAGE');
  });

  it('GET /v1/campaigns should list campaigns (200)', async () => {
    const response = await request(app.server)
      .get('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('campaigns');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.campaigns)).toBe(true);
  });

  it('GET /v1/campaigns/:id should get campaign by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Campaign GetById ${Date.now()}`,
        type: 'FIXED_VALUE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    const campaignId = createResponse.body.campaign.id;

    const response = await request(app.server)
      .get(`/v1/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('campaign');
    expect(response.body.campaign.id).toBe(campaignId);
  });

  it('PUT /v1/campaigns/:id should update a campaign (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Campaign Update ${Date.now()}`,
        type: 'PERCENTAGE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    const campaignId = createResponse.body.campaign.id;

    const response = await request(app.server)
      .put(`/v1/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Campaign Name',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('campaign');
    expect(response.body.campaign.name).toBe('Updated Campaign Name');
  });

  it('DELETE /v1/campaigns/:id should soft delete a campaign (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Campaign Delete ${Date.now()}`,
        type: 'FREE_SHIPPING',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    const campaignId = createResponse.body.campaign.id;

    const response = await request(app.server)
      .delete(`/v1/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
