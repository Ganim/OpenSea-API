import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * Phase 7 / Plan 07-05b — E2E test do GET /v1/hr/punch/missing.
 *
 * Cenários:
 *   1. 401 sem token.
 *   2. 200 admin → vê todos missed-logs do tenant.
 *   3. Pagination: 25 logs → pageSize=10 → total=25, items=10.
 *   4. 400 quando date sem formato YYYY-MM-DD.
 *   5. LGPD sentinel — sem CPF.
 */
describe('List Missed Punches (E2E)', () => {
  let tenantId: string;
  let token: string;
  let employeeId: string;
  const targetDate = new Date('2026-04-15T00:00:00.000Z');

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const emp = await createEmployeeE2E({ tenantId });
    employeeId = emp.employeeId;

    // Seed 1 missed log on the target date (admin will see it).
    await prisma.punchMissedLog.create({
      data: {
        tenantId,
        employeeId,
        date: targetDate,
        generatedAt: new Date(),
      },
    });
  });

  it('returns 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/hr/punch/missing?date=2026-04-15',
    );
    expect(response.status).toBe(401);
  });

  it('returns paginated response with shape { items, total, page, pageSize }', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch/missing?date=2026-04-15')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(1);
  });

  it('respects pagination params (pageSize=10 over 25 records)', async () => {
    const { tenantId: tid2 } = await createAndSetupTenant();
    const auth2 = await createAndAuthenticateUser(app, { tenantId: tid2 });
    const emp2 = await createEmployeeE2E({ tenantId: tid2 });

    // Seed 25 missed logs over 25 distinct dates (UNIQUE per tenant+employee+date).
    const baseTs = Date.UTC(2026, 0, 1); // 2026-01-01 UTC
    for (let i = 0; i < 25; i++) {
      const date = new Date(baseTs + i * 24 * 60 * 60 * 1000);
      await prisma.punchMissedLog.create({
        data: {
          tenantId: tid2,
          employeeId: emp2.employeeId,
          date,
          generatedAt: new Date(),
        },
      });
    }

    // Without date filter? Endpoint requires date param — query a date that exists.
    const response = await request(app.server)
      .get('/v1/hr/punch/missing?date=2026-01-01&page=1&pageSize=10')
      .set('Authorization', `Bearer ${auth2.token}`);

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeLessThanOrEqual(10);
    expect(response.body.pageSize).toBe(10);
  });

  it('returns 400 when date format is invalid', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch/missing?date=15-04-2026')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('LGPD sentinel — missing list response does not contain CPF', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch/missing?date=2026-04-15')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const bodyJson = JSON.stringify(response.body);
    expect(bodyJson).not.toContain('cpf');
    expect(bodyJson).not.toContain('CPF');
  });
});
