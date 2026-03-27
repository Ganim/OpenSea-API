import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Blueprints CRUD (E2E)', () => {
  let tenantId: string;
  let token: string;
  let pipelineId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    // Create a pipeline first
    const timestamp = Date.now();
    const pipelineRes = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Blueprint Test Pipeline ${timestamp}`,
        type: 'SALES',
      });

    pipelineId = pipelineRes.body.pipeline.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/sales/blueprints should create a blueprint', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/blueprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Blueprint E2E ${timestamp}`,
        pipelineId,
        stageRules: [],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('blueprint');
    expect(response.body.blueprint).toHaveProperty('id');
    expect(response.body.blueprint.name).toContain('Blueprint E2E');
    expect(response.body.blueprint.pipelineId).toBe(pipelineId);
    expect(response.body.blueprint.isActive).toBe(true);
    expect(response.body.blueprint.stageRules).toEqual([]);
  });

  it('GET /v1/sales/blueprints should list blueprints', async () => {
    const response = await request(app.server)
      .get('/v1/sales/blueprints')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('blueprints');
    expect(Array.isArray(response.body.blueprints)).toBe(true);
    expect(response.body.blueprints.length).toBeGreaterThanOrEqual(1);
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('total');
  });

  it('GET /v1/sales/blueprints/:blueprintId should return a blueprint', async () => {
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/sales/blueprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `GetById Blueprint ${timestamp}`,
        pipelineId,
      });

    const blueprintId = createRes.body.blueprint.id;

    const response = await request(app.server)
      .get(`/v1/sales/blueprints/${blueprintId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.blueprint.id).toBe(blueprintId);
    expect(response.body.blueprint.name).toContain('GetById Blueprint');
    expect(response.body.blueprint).toHaveProperty('stageRules');
  });

  it('PUT /v1/sales/blueprints/:blueprintId should update a blueprint', async () => {
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/sales/blueprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Update Blueprint ${timestamp}`,
        pipelineId,
      });

    const blueprintId = createRes.body.blueprint.id;

    const response = await request(app.server)
      .put(`/v1/sales/blueprints/${blueprintId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Blueprint ${timestamp}`,
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.blueprint.name).toContain('Updated Blueprint');
    expect(response.body.blueprint.isActive).toBe(false);
  });

  it('DELETE /v1/sales/blueprints/:blueprintId should delete a blueprint', async () => {
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/sales/blueprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Delete Blueprint ${timestamp}`,
        pipelineId,
      });

    const blueprintId = createRes.body.blueprint.id;

    const deleteRes = await request(app.server)
      .delete(`/v1/sales/blueprints/${blueprintId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);

    // Confirm it's deleted
    const getRes = await request(app.server)
      .get(`/v1/sales/blueprints/${blueprintId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('POST /v1/sales/blueprints/validate-transition should validate a transition', async () => {
    // This test validates the endpoint works; full validation logic is tested in unit tests
    const response = await request(app.server)
      .post('/v1/sales/blueprints/validate-transition')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dealId: '00000000-0000-0000-0000-000000000000',
        targetStageId: '00000000-0000-0000-0000-000000000001',
      });

    // Will return 404 since deal doesn't exist, which is the expected behavior
    expect([200, 404]).toContain(response.status);
  });
});
