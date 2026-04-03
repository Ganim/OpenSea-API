import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBankAccount } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';
import { randomUUID } from 'node:crypto';

describe('List Reconciliations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list reconciliations for the tenant', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const bankAccount = await createBankAccount(tenantId);

    // Create a reconciliation directly in DB
    await prisma.bankReconciliation.create({
      data: {
        id: randomUUID(),
        tenantId,
        bankAccountId: bankAccount.id,
        fileName: 'extrato-list-test.ofx',
        periodStart: new Date('2026-03-01'),
        periodEnd: new Date('2026-03-15'),
        totalTransactions: 3,
        matchedCount: 1,
        unmatchedCount: 2,
        status: 'IN_PROGRESS',
      },
    });

    const response = await request(app.server)
      .get('/v1/finance/reconciliation')
      .set('Authorization', `Bearer ${token}`)
      .query({ bankAccountId: bankAccount.id });

    expect(response.status).toBe(200);
    expect(response.body.reconciliations.length).toBeGreaterThanOrEqual(1);
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        page: 1,
        limit: 20,
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/finance/reconciliation',
    );

    expect(response.status).toBe(401);
  });
});
