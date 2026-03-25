import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Activities (E2E)', () => {
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

  it('POST /v1/activities should create an activity (201)', async () => {
    const response = await request(app.server)
      .post('/v1/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'NOTE',
        title: 'Follow up with client about proposal',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('activity');
    expect(response.body.activity).toHaveProperty('id');
    expect(response.body.activity.type).toBe('NOTE');
    expect(response.body.activity.title).toBe(
      'Follow up with client about proposal',
    );
  });

  it('GET /v1/activities should list activities (200)', async () => {
    const response = await request(app.server)
      .get('/v1/activities')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('activities');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.activities)).toBe(true);
  });

  it('PUT /v1/activities/:activityId should update an activity (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'TASK',
        title: 'Prepare quarterly report',
      });

    const activityId = createResponse.body.activity.id;

    const response = await request(app.server)
      .put(`/v1/activities/${activityId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Prepare quarterly report - Updated',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('activity');
    expect(response.body.activity.title).toBe(
      'Prepare quarterly report - Updated',
    );
  });

  it('DELETE /v1/activities/:activityId should delete an activity (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'MEETING',
        title: 'Team standup meeting',
      });

    const activityId = createResponse.body.activity.id;

    const response = await request(app.server)
      .delete(`/v1/activities/${activityId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});
