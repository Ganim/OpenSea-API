import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('CRM E2E (Contacts, Pipelines, Deals)', () => {
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

    // Create a customer for contacts and deals
    const timestamp = Date.now();
    const customerRes = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `CRM Customer ${timestamp}`,
        type: 'BUSINESS',
        email: `crm-customer-${timestamp}@example.com`,
      });

    customerId = customerRes.body.customer.id;
  });

  // ── Contacts ────────────────────────────────────────────────────────────────

  it('POST /v1/contacts should create a contact (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        firstName: `Contact ${timestamp}`,
        lastName: 'CRM',
        email: `contact-crm-${timestamp}@example.com`,
        role: 'DECISION_MAKER',
        lifecycleStage: 'LEAD',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('contact');
    expect(response.body.contact).toHaveProperty('id');
    expect(response.body.contact.customerId).toBe(customerId);
  });

  it('GET /v1/contacts should list contacts (200)', async () => {
    const response = await request(app.server)
      .get('/v1/contacts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('contacts');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.contacts)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  // ── Pipelines ───────────────────────────────────────────────────────────────

  it('POST /v1/pipelines should create a pipeline (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `CRM Pipeline ${timestamp}`,
        description: 'E2E CRM pipeline',
        type: 'SALES',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('pipeline');
    expect(response.body.pipeline).toHaveProperty('id');
    expect(response.body.pipeline.type).toBe('SALES');

    pipelineId = response.body.pipeline.id;
  });

  it('GET /v1/pipelines should list pipelines (200)', async () => {
    const response = await request(app.server)
      .get('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pipelines');
    expect(Array.isArray(response.body.pipelines)).toBe(true);
    expect(response.body.pipelines.length).toBeGreaterThanOrEqual(1);
  });

  // ── Deals ───────────────────────────────────────────────────────────────────

  it('POST /v1/deals should create a deal (201)', async () => {
    // Create a stage in the pipeline first
    const stageRes = await request(app.server)
      .post(`/v1/pipelines/${pipelineId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Prospecting',
        type: 'OPEN',
        position: 1,
      });

    stageId = stageRes.body.stage.id;

    const response = await request(app.server)
      .post('/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Deal E2E ${Date.now()}`,
        customerId,
        pipelineId,
        stageId,
        value: 5000,
        currency: 'BRL',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('deal');
    expect(response.body.deal).toHaveProperty('id');
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
    expect(response.body.meta).toHaveProperty('total');
  });
});
