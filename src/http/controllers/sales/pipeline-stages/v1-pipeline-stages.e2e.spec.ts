import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Pipeline Stages CRUD (E2E)', () => {
  let tenantId: string;
  let token: string;
  let pipelineId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    // Create a pipeline to hold stages
    const timestamp = Date.now();
    const pipelineRes = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Stages Test Pipeline ${timestamp}`,
        type: 'SALES',
      });

    pipelineId = pipelineRes.body.pipeline.id;
  });

  it('POST /v1/pipelines/:pipelineId/stages should create a stage', async () => {
    const response = await request(app.server)
      .post(`/v1/pipelines/${pipelineId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Qualification',
        type: 'OPEN',
        position: 0,
        color: '#3B82F6',
        probability: 25,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('stage');
    expect(response.body.stage).toHaveProperty('id');
    expect(response.body.stage.name).toBe('Qualification');
    expect(response.body.stage.type).toBe('OPEN');
    expect(response.body.stage.pipelineId).toBe(pipelineId);
  });

  it('GET /v1/pipelines/:pipelineId/stages should list stages', async () => {
    const response = await request(app.server)
      .get(`/v1/pipelines/${pipelineId}/stages`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('stages');
    expect(Array.isArray(response.body.stages)).toBe(true);
    expect(response.body.stages.length).toBeGreaterThanOrEqual(1);
  });

  it('PUT /v1/pipelines/:pipelineId/stages/:stageId should update a stage', async () => {
    // Create a stage first
    const createRes = await request(app.server)
      .post(`/v1/pipelines/${pipelineId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'To Update',
        type: 'OPEN',
        position: 1,
      });

    const stageId = createRes.body.stage.id;

    const response = await request(app.server)
      .put(`/v1/pipeline-stages/${stageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Stage',
        probability: 50,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('stage');
    expect(response.body.stage.name).toBe('Updated Stage');
  });

  it('DELETE /v1/pipelines/:pipelineId/stages/:stageId should delete a stage', async () => {
    // Create a stage first
    const createRes = await request(app.server)
      .post(`/v1/pipelines/${pipelineId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'To Delete',
        type: 'OPEN',
        position: 99,
      });

    const stageId = createRes.body.stage.id;

    const response = await request(app.server)
      .delete(`/v1/pipeline-stages/${stageId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
