import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Deals (E2E)', () => {
  let tenantId: string;
  let token: string;
  let customerId: string;
  let pipelineId: string;
  let stageId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    // Create a customer (required for deals)
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Deal Test Customer ${Date.now()}`,
        type: 'BUSINESS',
        email: `deal-customer-${Date.now()}@example.com`,
      });
    customerId = customerResponse.body.customer.id;

    // Create a pipeline (required for deals)
    const pipelineResponse = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Deal Test Pipeline ${Date.now()}`,
        type: 'SALES',
      });
    pipelineId = pipelineResponse.body.pipeline.id;

    // Create a stage in the pipeline (required for deals)
    const stageResponse = await request(app.server)
      .post(`/v1/pipelines/${pipelineId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Qualification',
        type: 'OPEN',
        position: 0,
      });
    stageId = stageResponse.body.stage.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/deals should create a deal (201)', async () => {
    const response = await request(app.server)
      .post('/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Enterprise Software License 2026',
        customerId,
        pipelineId,
        stageId,
        value: 50000,
        currency: 'BRL',
        tags: [],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('deal');
    expect(response.body.deal).toHaveProperty('id');
    expect(response.body.deal.title).toBe('Enterprise Software License 2026');
    expect(response.body.deal.customerId).toBe(customerId);
    expect(response.body.deal.pipelineId).toBe(pipelineId);
    expect(response.body.deal.stageId).toBe(stageId);
  });

  it('GET /v1/deals should list deals (200)', async () => {
    const response = await request(app.server)
      .get('/v1/deals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deals');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.deals)).toBe(true);
  });

  it('GET /v1/deals/:dealId should get deal by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Consulting Contract Q3',
        customerId,
        pipelineId,
        stageId,
        value: 25000,
        tags: [],
      });

    const dealId = createResponse.body.deal.id;

    const response = await request(app.server)
      .get(`/v1/deals/${dealId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deal');
    expect(response.body.deal.id).toBe(dealId);
    expect(response.body.deal.title).toBe('Consulting Contract Q3');
  });

  it('PUT /v1/deals/:dealId should update a deal (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Annual Maintenance Contract',
        customerId,
        pipelineId,
        stageId,
        value: 12000,
        tags: [],
      });

    const dealId = createResponse.body.deal.id;

    const response = await request(app.server)
      .put(`/v1/deals/${dealId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Annual Maintenance Contract - Renewed',
        value: 15000,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deal');
    expect(response.body.deal.title).toBe(
      'Annual Maintenance Contract - Renewed',
    );
  });

  it('DELETE /v1/deals/:dealId should delete a deal (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Temporary Deal To Delete',
        customerId,
        pipelineId,
        stageId,
        tags: [],
      });

    const dealId = createResponse.body.deal.id;

    const response = await request(app.server)
      .delete(`/v1/deals/${dealId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});
