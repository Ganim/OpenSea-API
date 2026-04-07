import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Pipelines CRUD (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('POST /v1/pipelines should create a pipeline', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Pipeline E2E ${timestamp}`,
        description: 'Test pipeline for E2E',
        type: 'SALES',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('pipeline');
    expect(response.body.pipeline).toHaveProperty('id');
    expect(response.body.pipeline.name).toContain('Pipeline E2E');
    expect(response.body.pipeline.type).toBe('SALES');
    expect(response.body.pipeline.isActive).toBe(true);
  });

  it('GET /v1/pipelines should list pipelines', async () => {
    const response = await request(app.server)
      .get('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pipelines');
    expect(Array.isArray(response.body.pipelines)).toBe(true);
    expect(response.body.pipelines.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /v1/pipelines/:pipelineId should return a pipeline with stages', async () => {
    // First create a pipeline
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `GetById Pipeline ${timestamp}`,
        type: 'SALES',
      });

    const pipelineId = createRes.body.pipeline.id;

    const response = await request(app.server)
      .get(`/v1/pipelines/${pipelineId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pipeline');
    expect(response.body.pipeline.id).toBe(pipelineId);
    expect(response.body.pipeline.name).toContain('GetById Pipeline');
    expect(response.body.pipeline).toHaveProperty('stages');
  });

  it('PUT /v1/pipelines/:pipelineId should update a pipeline', async () => {
    // First create a pipeline
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Update Pipeline ${timestamp}`,
        type: 'SALES',
      });

    const pipelineId = createRes.body.pipeline.id;

    const response = await request(app.server)
      .put(`/v1/pipelines/${pipelineId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Pipeline Name',
        description: 'Updated description',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pipeline');
    expect(response.body.pipeline.name).toBe('Updated Pipeline Name');
    expect(response.body.pipeline.description).toBe('Updated description');
  });

  it('DELETE /v1/pipelines/:pipelineId should delete a pipeline', async () => {
    // First create a pipeline
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Delete Pipeline ${timestamp}`,
        type: 'SALES',
      });

    const pipelineId = createRes.body.pipeline.id;

    const response = await request(app.server)
      .delete(`/v1/pipelines/${pipelineId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
