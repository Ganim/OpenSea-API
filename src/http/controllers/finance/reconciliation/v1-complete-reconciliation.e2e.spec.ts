import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBankAccount } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';
import { randomUUID } from 'node:crypto';

describe('Complete Reconciliation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should complete a reconciliation', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const bankAccount = await createBankAccount(tenantId);

    const reconciliationId = randomUUID();

    await prisma.bankReconciliation.create({
      data: {
        id: reconciliationId,
        tenantId,
        bankAccountId: bankAccount.id,
        fileName: 'extrato-complete.ofx',
        periodStart: new Date('2026-03-01'),
        periodEnd: new Date('2026-03-15'),
        totalTransactions: 2,
        matchedCount: 2,
        unmatchedCount: 0,
        status: 'IN_PROGRESS',
      },
    });

    const response = await request(app.server)
      .post(`/v1/finance/reconciliation/${reconciliationId}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.reconciliation.status).toBe('COMPLETED');
  });

  it('should return 404 for non-existent reconciliation', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(`/v1/finance/reconciliation/${randomUUID()}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      `/v1/finance/reconciliation/${randomUUID()}/complete`,
    );

    expect(response.status).toBe(401);
  });
});
