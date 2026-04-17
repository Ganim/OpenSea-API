import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * Smoke-level e2e for the three period-locks controllers (create, list,
 * delete). Each controller previously had zero e2e coverage (P2-63 from
 * FINANCE-AUDIT-2026-04-16.md).
 *
 * The isolation spec v1-period-locks-multi-tenant-isolation already
 * exercises the happy-path create and list internally; these smoke
 * tests lock the HTTP contract (status codes, response shape, 401/409)
 * for callers who only check the public interface.
 */
describe('Period Locks CRUD smoke (E2E)', () => {
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId } = await createAndSetupTenant({
      name: 'Period Locks CRUD smoke',
    });
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  }, 60000);

  it('should return 401 for create without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/period-locks')
      .send({ year: 2010, month: 1 });

    expect(response.status).toBe(401);
  });

  it('should return 401 for list without auth', async () => {
    const response = await request(app.server).get('/v1/finance/period-locks');
    expect(response.status).toBe(401);
  });

  it('should return 401 for delete without auth', async () => {
    const response = await request(app.server).delete(
      '/v1/finance/period-locks/00000000-0000-0000-0000-000000000000',
    );
    expect(response.status).toBe(401);
  });

  it('should create, list and release a period lock end-to-end', async () => {
    // 1. Create
    const createResp = await request(app.server)
      .post('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2010, month: 3, reason: 'Smoke test' });

    expect(createResp.status).toBe(201);
    expect(createResp.body.lock).toBeDefined();
    expect(createResp.body.lock.year).toBe(2010);
    expect(createResp.body.lock.month).toBe(3);
    const lockId = createResp.body.lock.id;

    // 2. List — includes the newly created lock
    const listResp = await request(app.server)
      .get('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${token}`);

    expect(listResp.status).toBe(200);
    expect(Array.isArray(listResp.body.locks)).toBe(true);
    const ids = (listResp.body.locks as Array<{ id: string }>).map(
      (lock) => lock.id,
    );
    expect(ids).toContain(lockId);

    // 3. Delete (release)
    const deleteResp = await request(app.server)
      .delete(`/v1/finance/period-locks/${lockId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResp.status).toBe(200);
    expect(deleteResp.body.released).toBe(true);
  });

  it('should reject creating a duplicate active lock with 409 (conflict)', async () => {
    // First lock succeeds
    const firstResp = await request(app.server)
      .post('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2010, month: 7 });
    expect(firstResp.status).toBe(201);

    // Second attempt for the same (year, month) while the first is active
    const duplicateResp = await request(app.server)
      .post('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2010, month: 7 });

    expect(duplicateResp.status).toBe(409);
    expect(duplicateResp.body.message).toMatch(/07\/2010/);
  });

  it('should filter list by year query param', async () => {
    await request(app.server)
      .post('/v1/finance/period-locks')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2011, month: 2 });

    const response = await request(app.server)
      .get('/v1/finance/period-locks?year=2011')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const years = (response.body.locks as Array<{ year: number }>).map(
      (lock) => lock.year,
    );
    // All returned locks must be 2011 — the server-side filter must hold
    for (const year of years) {
      expect(year).toBe(2011);
    }
  });

  it('should return 404 when deleting a non-existent lock id', async () => {
    const response = await request(app.server)
      .delete('/v1/finance/period-locks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
