import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Analytics (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  // --- Goals ---

  it('POST /v1/sales/analytics/goals should create a goal (201)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/analytics/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Meta Marco',
        type: 'REVENUE',
        targetValue: 100000,
        period: 'MONTHLY',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        scope: 'TENANT',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('goal');
    expect(response.body.goal).toHaveProperty('id');
  });

  it('GET /v1/sales/analytics/goals should list goals (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/analytics/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('goals');
    expect(Array.isArray(response.body.goals)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('perPage');
    expect(response.body).toHaveProperty('totalPages');
  });

  // --- Dashboards ---

  it('GET /v1/sales/analytics/dashboards should list dashboards (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/analytics/dashboards')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('dashboards');
    expect(Array.isArray(response.body.dashboards)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('perPage');
    expect(response.body).toHaveProperty('totalPages');
  });

  it('POST /v1/sales/analytics/dashboards should create a dashboard (201)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/analytics/dashboards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Visao Geral',
        visibility: 'TENANT',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('dashboard');
    expect(response.body.dashboard).toHaveProperty('id');
  });

  // --- Reports ---

  it('GET /v1/sales/analytics/reports should list reports (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/analytics/reports')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reports');
    expect(Array.isArray(response.body.reports)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('perPage');
    expect(response.body).toHaveProperty('totalPages');
  });

  // --- Rankings ---

  it('GET /v1/sales/analytics/rankings/sellers should get seller ranking (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/analytics/rankings/sellers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rankings');
    expect(Array.isArray(response.body.rankings)).toBe(true);
    expect(response.body).toHaveProperty('period');
  });
});
