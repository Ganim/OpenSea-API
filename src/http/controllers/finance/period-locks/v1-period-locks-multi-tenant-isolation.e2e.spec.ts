import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * Cross-tenant isolation contract for the Period Locks surface
 * (closes part of P2-52 from FINANCE-AUDIT-2026-04-16.md).
 *
 * Period locks are the accounting-period-close gate: once a month is
 * locked, no finance entries in that month can be edited. A cross-tenant
 * lock leak would let Tenant B release Tenant A's closed month, which
 * can invalidate audited statements and compliance reports (ADR 027).
 *
 * Pattern: lock a period in Tenant A, then verify Tenant B cannot see
 * it in its list endpoint and cannot release it by id.
 */
describe('Period Locks Multi-Tenant Isolation (E2E)', () => {
  let tokenA: string;
  let periodLockAId: string;

  let tokenB: string;

  beforeAll(async () => {
    await app.ready();

    // ── Tenant A: seed a real period lock via the API ───────────────────
    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Period Locks Isolation - Tenant A',
    });
    const authA = await createAndAuthenticateUser(app, { tenantId: tidA });
    tokenA = authA.token;

    // Use a fixed (year, month) in the past that will not clash with
    // other concurrent tests. year=2001 is safely before any test data.
    const createResp = await request(app.server)
      .post('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        year: 2001,
        month: 6,
        reason: 'Tenant A locking June 2001 for isolation test',
      });

    expect(createResp.status).toBe(201);
    periodLockAId = createResp.body.lock.id;

    // ── Tenant B: separate tenant + token ───────────────────────────────
    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Period Locks Isolation - Tenant B',
    });
    const authB = await createAndAuthenticateUser(app, { tenantId: tidB });
    tokenB = authB.token;
  }, 60000);

  it("should NOT include another tenant's period lock in the list", async () => {
    const response = await request(app.server)
      .get('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    const ids =
      (response.body.locks as Array<{ id: string }> | undefined)?.map(
        (lock) => lock.id,
      ) ?? [];
    expect(ids).not.toContain(periodLockAId);
  });

  it("should NOT release another tenant's period lock (404)", async () => {
    const response = await request(app.server)
      .delete(`/v1/finance/period-locks/${periodLockAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  it('should still allow Tenant A to see its own period lock in the list', async () => {
    const response = await request(app.server)
      .get('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    const ids = (response.body.locks as Array<{ id: string }>).map(
      (lock) => lock.id,
    );
    expect(ids).toContain(periodLockAId);
  });

  it('should allow Tenant A to create a lock for the same (year, month) Tenant B wants — no cross-tenant unique collision', async () => {
    // If the unique constraint were on (year, month) instead of
    // (tenantId, year, month), Tenant B would get a 409 here.
    const response = await request(app.server)
      .post('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        year: 2001,
        month: 6,
        reason: 'Tenant B also locking June 2001',
      });

    // Must succeed — tenant scope keeps the locks independent.
    expect(response.status).toBe(201);
    expect(response.body.lock.id).not.toBe(periodLockAId);
  });
});
