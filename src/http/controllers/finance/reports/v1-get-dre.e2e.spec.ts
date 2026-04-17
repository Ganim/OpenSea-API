import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * Smoke-level e2e for GET /v1/finance/reports/dre (P2-63). The DRE
 * controller previously had zero e2e coverage — only the accountant
 * portal equivalent was tested.
 *
 * These tests validate the HTTP contract (auth, querystring, response
 * shape) without seeding entries: an empty tenant must return a valid
 * zero-valued DRE with all 12 monthly rows.
 */
describe('Get DRE (E2E)', () => {
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId } = await createAndSetupTenant({
      name: 'DRE smoke',
    });
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  }, 60000);

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/finance/reports/dre?year=2026',
    );
    expect(response.status).toBe(401);
  });

  it('should return 400 when year query param is missing', async () => {
    const response = await request(app.server)
      .get('/v1/finance/reports/dre')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should return 400 when year is out of range', async () => {
    const response = await request(app.server)
      .get('/v1/finance/reports/dre?year=1999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should return a zero-valued DRE for an empty tenant', async () => {
    const response = await request(app.server)
      .get('/v1/finance/reports/dre?year=2026')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.year).toBe(2026);
    expect(response.body.totalRevenue).toBe(0);
    expect(response.body.totalExpenses).toBe(0);
    expect(response.body.netResult).toBe(0);
    expect(response.body.netMargin).toBe(0);

    // Must return exactly 12 monthly rows with months 1..12
    expect(response.body.monthly).toHaveLength(12);
    const months = (response.body.monthly as Array<{ month: number }>).map(
      (row) => row.month,
    );
    expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    for (const row of response.body.monthly as Array<{
      revenue: number;
      expenses: number;
      result: number;
    }>) {
      expect(row.revenue).toBe(0);
      expect(row.expenses).toBe(0);
      expect(row.result).toBe(0);
    }
  });
});
