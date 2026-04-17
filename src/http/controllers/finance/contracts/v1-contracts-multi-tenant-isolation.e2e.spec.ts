import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

/**
 * Cross-tenant isolation contract for the Contracts surface — closes one
 * of the six entity specs requested by P2-52 from
 * FINANCE-AUDIT-2026-04-16.md. Pattern mirrors the Loans isolation spec.
 */
describe('Contracts Multi-Tenant Isolation (E2E)', () => {
  let tokenA: string;
  let contractAId: string;
  let tokenB: string;

  beforeAll(async () => {
    await app.ready();

    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Contracts Isolation - Tenant A',
    });
    const authA = await createAndAuthenticateUser(app, { tenantId: tidA });
    tokenA = authA.token;

    const { category, costCenter } = await createFinancePrerequisites(tidA);

    const createResp = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: `Tenant A Contract ${Date.now()}`,
        companyName: 'Supplier A',
        totalValue: 12000,
        paymentFrequency: 'MONTHLY',
        paymentAmount: 1000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        categoryId: category.id,
        costCenterId: costCenter.id,
      });

    expect(createResp.status).toBe(201);
    contractAId = createResp.body.contract.id;

    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Contracts Isolation - Tenant B',
    });
    const authB = await createAndAuthenticateUser(app, { tenantId: tidB });
    tokenB = authB.token;
  }, 60000);

  it('should NOT get a contract from another tenant', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/contracts/${contractAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  it("should NOT include another tenant's contract in the list", async () => {
    const response = await request(app.server)
      .get('/v1/finance/contracts')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    const ids =
      (response.body.contracts as Array<{ id: string }> | undefined)?.map(
        (c) => c.id,
      ) ?? [];
    expect(ids).not.toContain(contractAId);
  });

  it('should NOT update a contract from another tenant', async () => {
    const response = await request(app.server)
      .put(`/v1/finance/contracts/${contractAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked by Tenant B' });

    expect(response.status).toBe(404);
  });

  it('should NOT delete a contract from another tenant', async () => {
    const response = await request(app.server)
      .delete(`/v1/finance/contracts/${contractAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  it('should still allow Tenant A to read its own contract', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/contracts/${contractAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.contract.id).toBe(contractAId);
  });
});
