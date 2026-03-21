import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Admin Monitoring (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // GET /v1/admin/monitoring/health
  it('should return system health status', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.health).toHaveProperty('status');
    expect(response.body.health).toHaveProperty('uptime');
    expect(response.body.health).toHaveProperty('services');
    expect(response.body.health.services).toHaveProperty('api');
    expect(response.body.health.services).toHaveProperty('database');
    expect(response.body.health.services).toHaveProperty('redis');
  });

  it('should return 403 for health endpoint when not super admin', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  // GET /v1/admin/monitoring/integrations
  it('should return integration status overview', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/integrations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalIntegrations');
    expect(response.body).toHaveProperty('countByStatus');
    expect(response.body.countByStatus).toHaveProperty('CONNECTED');
    expect(response.body.countByStatus).toHaveProperty('ERROR');
    expect(response.body).toHaveProperty('byType');
    expect(response.body).toHaveProperty('tenantsWithErrors');
  });

  // GET /v1/admin/monitoring/ai-usage
  it('should return AI usage report', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/ai-usage')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('period');
    expect(response.body).toHaveProperty('totalAiQueries');
    expect(response.body).toHaveProperty('totalAiCost');
    expect(response.body).toHaveProperty('tierBreakdown');
    expect(response.body).toHaveProperty('topTenantsByAiCost');
  });

  it('should accept period query parameter for AI usage', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/ai-usage?period=2026-01')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.period).toBe('2026-01');
  });

  // GET /v1/admin/monitoring/revenue
  it('should return revenue metrics', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/revenue')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('mrr');
    expect(response.body).toHaveProperty('activeSubscriptionCount');
    expect(response.body).toHaveProperty('overageTotal');
    expect(response.body).toHaveProperty('churnRate');
    expect(response.body).toHaveProperty('tenantCountByStatus');
    expect(response.body).toHaveProperty('period');
    expect(typeof response.body.mrr).toBe('number');
  });

  it('should return 403 for revenue endpoint when not super admin', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/revenue')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
