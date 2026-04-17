import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

/**
 * Cross-tenant isolation contract for the Consortia surface — closes one
 * of the six entity specs requested by P2-52 from
 * FINANCE-AUDIT-2026-04-16.md. Pattern mirrors the Loans isolation spec.
 */
describe('Consortia Multi-Tenant Isolation (E2E)', () => {
  let tokenA: string;
  let consortiumAId: string;
  let tokenB: string;

  beforeAll(async () => {
    await app.ready();

    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Consortia Isolation - Tenant A',
    });
    const authA = await createAndAuthenticateUser(app, { tenantId: tidA });
    tokenA = authA.token;

    const { bankAccount, costCenter } = await createFinancePrerequisites(tidA);

    const createResp = await request(app.server)
      .post('/v1/finance/consortia')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Tenant A Consortium',
        administrator: 'Caixa Consórcios',
        bankAccountId: bankAccount.id,
        costCenterId: costCenter.id,
        creditValue: 200000,
        monthlyPayment: 2500,
        totalInstallments: 80,
        startDate: new Date().toISOString(),
      });

    expect(createResp.status).toBe(201);
    consortiumAId = createResp.body.consortium.id;

    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Consortia Isolation - Tenant B',
    });
    const authB = await createAndAuthenticateUser(app, { tenantId: tidB });
    tokenB = authB.token;
  }, 60000);

  it('should NOT get a consortium from another tenant', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/consortia/${consortiumAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  it("should NOT include another tenant's consortium in the list", async () => {
    const response = await request(app.server)
      .get('/v1/finance/consortia')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    const ids = (response.body.consortia as Array<{ id: string }> | undefined)
      ?.map((c) => c.id) ?? [];
    expect(ids).not.toContain(consortiumAId);
  });

  it('should NOT update a consortium from another tenant', async () => {
    const response = await request(app.server)
      .put(`/v1/finance/consortia/${consortiumAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hacked by Tenant B' });

    expect(response.status).toBe(404);
  });

  it('should NOT delete a consortium from another tenant', async () => {
    const response = await request(app.server)
      .delete(`/v1/finance/consortia/${consortiumAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  it('should still allow Tenant A to read its own consortium', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/consortia/${consortiumAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.consortium.id).toBe(consortiumAId);
  });
});
