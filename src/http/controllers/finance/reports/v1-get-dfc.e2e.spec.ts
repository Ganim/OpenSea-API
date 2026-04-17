import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * Smoke-level e2e for GET /v1/finance/reports/dfc (P2-63). The DFC
 * (Demonstração dos Fluxos de Caixa) controller previously had zero e2e
 * coverage.
 *
 * These tests validate the HTTP contract for an empty tenant: the
 * operating/investing/financing activities must all be zero, the
 * monthly breakdown must contain 12 rows, and the drill-down
 * categories array must be empty.
 */
describe('Get DFC (E2E)', () => {
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId } = await createAndSetupTenant({
      name: 'DFC smoke',
    });
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  }, 60000);

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/finance/reports/dfc?year=2026',
    );
    expect(response.status).toBe(401);
  });

  it('should return 400 when year query param is missing', async () => {
    const response = await request(app.server)
      .get('/v1/finance/reports/dfc')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should return a zero-valued DFC for an empty tenant', async () => {
    const response = await request(app.server)
      .get('/v1/finance/reports/dfc?year=2026')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.year).toBe(2026);
    expect(response.body.operating).toBe(0);
    expect(response.body.investing).toBe(0);
    expect(response.body.financing).toBe(0);
    expect(response.body.netCashFlow).toBe(0);

    expect(response.body.monthly).toHaveLength(12);
    for (const row of response.body.monthly as Array<{
      month: number;
      operating: number;
      investing: number;
      financing: number;
      net: number;
    }>) {
      expect(row.month).toBeGreaterThanOrEqual(1);
      expect(row.month).toBeLessThanOrEqual(12);
      expect(row.operating).toBe(0);
      expect(row.investing).toBe(0);
      expect(row.financing).toBe(0);
      expect(row.net).toBe(0);
    }

    // No paid entries → no drill-down categories
    expect(Array.isArray(response.body.categories)).toBe(true);
    expect(response.body.categories).toHaveLength(0);
  });
});
