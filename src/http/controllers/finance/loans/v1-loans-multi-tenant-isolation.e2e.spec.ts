import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

/**
 * Cross-tenant isolation contract for the Loans surface (closes part of
 * P2-52 from FINANCE-AUDIT-2026-04-16.md). Mirrors the existing entries
 * isolation spec so adding a similar one for consortia, contracts,
 * payment-orders, journal-entries, period-locks and escalations becomes
 * a copy-paste.
 *
 * Pattern: build two tenants with disjoint authentication, create a loan
 * in Tenant A, then verify Tenant B receives 404 on every read/write
 * keyed by the loan's id.
 */
describe('Loans Multi-Tenant Isolation (E2E)', () => {
  let tenantAId: string;
  let tokenA: string;
  let loanAId: string;

  let tokenB: string;

  beforeAll(async () => {
    await app.ready();

    // ── Tenant A: create real loan ──────────────────────────────────────
    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Loans Isolation - Tenant A',
    });
    tenantAId = tidA;

    const authA = await createAndAuthenticateUser(app, { tenantId: tenantAId });
    tokenA = authA.token;

    const { bankAccount, costCenter } =
      await createFinancePrerequisites(tenantAId);

    const createResp = await request(app.server)
      .post('/v1/finance/loans')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Tenant A Loan',
        type: 'PERSONAL',
        bankAccountId: bankAccount.id,
        costCenterId: costCenter.id,
        principalAmount: 10000,
        interestRate: 1.5,
        startDate: new Date().toISOString(),
        totalInstallments: 12,
      });

    expect(createResp.status).toBe(201);
    loanAId = createResp.body.loan.id;

    // ── Tenant B: separate tenant + token ───────────────────────────────
    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Loans Isolation - Tenant B',
    });
    const authB = await createAndAuthenticateUser(app, { tenantId: tidB });
    tokenB = authB.token;
  }, 60000);

  it('should NOT get a loan from another tenant', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/loans/${loanAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  it("should NOT include another tenant's loan in the list", async () => {
    const response = await request(app.server)
      .get('/v1/finance/loans')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    const ids = (response.body.loans as Array<{ id: string }>).map((l) => l.id);
    expect(ids).not.toContain(loanAId);
  });

  it('should NOT update a loan from another tenant', async () => {
    const response = await request(app.server)
      .put(`/v1/finance/loans/${loanAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hacked by Tenant B' });

    expect(response.status).toBe(404);
  });

  it('should NOT delete a loan from another tenant', async () => {
    const response = await request(app.server)
      .delete(`/v1/finance/loans/${loanAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  it('should still allow Tenant A to read its own loan', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/loans/${loanAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.loan.id).toBe(loanAId);
  });
});
