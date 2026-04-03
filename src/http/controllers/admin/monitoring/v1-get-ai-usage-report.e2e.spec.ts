import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin Get AI Usage Report (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


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

  it('should accept period query parameter', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/ai-usage?period=2026-01')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.period).toBe('2026-01');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/ai-usage')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
