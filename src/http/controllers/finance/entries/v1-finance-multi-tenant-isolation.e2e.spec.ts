import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createFinancePrerequisites,
  createFinanceEntry,
} from '@/utils/tests/factories/finance/create-finance-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Finance Multi-Tenant Isolation (E2E)', () => {
  // Tenant A
  let tenantAId: string;
  let tokenA: string;
  let entryAId: string;

  // Tenant B
  let tenantBId: string;
  let tokenB: string;

  beforeAll(async () => {
    await app.ready();

    // ── Tenant A setup ──────────────────────────────────────────────────
    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Finance Isolation - Tenant A',
    });
    tenantAId = tidA;

    const authA = await createAndAuthenticateUser(app, {
      tenantId: tenantAId,
    });
    tokenA = authA.token;

    // Create finance entry for Tenant A
    const { category, costCenter } =
      await createFinancePrerequisites(tenantAId);
    const entry = await createFinanceEntry(tenantAId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });
    entryAId = entry.id;

    // ── Tenant B setup ──────────────────────────────────────────────────
    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Finance Isolation - Tenant B',
    });
    tenantBId = tidB;

    const authB = await createAndAuthenticateUser(app, {
      tenantId: tenantBId,
    });
    tokenB = authB.token;
  }, 60000);

  // ── GET isolation ─────────────────────────────────────────────────────

  it('should NOT get a finance entry from another tenant', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/entries/${entryAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  // ── LIST isolation ────────────────────────────────────────────────────

  it('should NOT list finance entries from another tenant', async () => {
    const response = await request(app.server)
      .get('/v1/finance/entries')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);

    const entryIds = response.body.entries.map((e: { id: string }) => e.id);
    expect(entryIds).not.toContain(entryAId);
  });

  // ── DELETE isolation ──────────────────────────────────────────────────

  it('should NOT delete a finance entry from another tenant', async () => {
    const response = await request(app.server)
      .delete(`/v1/finance/entries/${entryAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    // Entry not found in Tenant B scope
    expect(response.status).toBe(404);
  });

  // ── UPDATE isolation ──────────────────────────────────────────────────

  it('should NOT update a finance entry from another tenant', async () => {
    const response = await request(app.server)
      .patch(`/v1/finance/entries/${entryAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ description: 'Hacked by Tenant B' });

    expect(response.status).toBe(404);
  });

  // ── PAYMENT isolation ─────────────────────────────────────────────────

  it('should NOT register a payment on an entry from another tenant', async () => {
    const response = await request(app.server)
      .post(`/v1/finance/entries/${entryAId}/payments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        amount: 500,
        paidAt: new Date().toISOString(),
      });

    // Entry not found in Tenant B scope
    expect(response.status).toBe(404);
  });

  // ── CANCEL isolation ──────────────────────────────────────────────────

  it('should NOT cancel a finance entry from another tenant', async () => {
    const response = await request(app.server)
      .post(`/v1/finance/entries/${entryAId}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  // ── Verify Tenant A still has access ──────────────────────────────────

  it('should still allow Tenant A to access its own entry', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/entries/${entryAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.entry.id).toBe(entryAId);
  });
});
