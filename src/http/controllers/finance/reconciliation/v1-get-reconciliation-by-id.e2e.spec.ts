import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBankAccount } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';
import { randomUUID } from 'node:crypto';

describe('Get Reconciliation By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get a reconciliation with items', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const bankAccount = await createBankAccount(tenantId);

    const reconciliationId = randomUUID();

    await prisma.bankReconciliation.create({
      data: {
        id: reconciliationId,
        tenantId,
        bankAccountId: bankAccount.id,
        fileName: 'extrato-get-test.ofx',
        periodStart: new Date('2026-03-01'),
        periodEnd: new Date('2026-03-15'),
        totalTransactions: 1,
        status: 'IN_PROGRESS',
      },
    });

    await prisma.bankReconciliationItem.create({
      data: {
        id: randomUUID(),
        reconciliationId,
        fitId: `FIT-${Date.now()}`,
        transactionDate: new Date('2026-03-05'),
        amount: 150.0,
        description: 'PIX ENVIADO',
        type: 'DEBIT',
        matchStatus: 'UNMATCHED',
      },
    });

    const response = await request(app.server)
      .get(`/v1/finance/reconciliation/${reconciliationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.reconciliation.id).toBe(reconciliationId);
    expect(response.body.reconciliation.items).toHaveLength(1);
  });

  it('should return 404 for non-existent reconciliation', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(`/v1/finance/reconciliation/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
