import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Entry Escalation History (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get escalation history for an entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create a finance category and cost center first
    const category = await prisma.financeCategory.create({
      data: {
        tenantId,
        name: 'E2E Category',
        slug: `e2e-cat-${Date.now()}`,
        type: 'REVENUE',
      },
    });

    const costCenter = await prisma.costCenter.create({
      data: {
        tenantId,
        code: `CC-${Date.now()}`,
        name: 'E2E Cost Center',
      },
    });

    // Create a finance entry
    const entry = await prisma.financeEntry.create({
      data: {
        tenantId,
        type: 'RECEIVABLE',
        code: `REC-E2E-${Date.now()}`,
        description: 'E2E Test Entry',
        categoryId: category.id,
        costCenterId: costCenter.id,
        expectedAmount: 1000,
        issueDate: new Date(),
        dueDate: new Date(),
        status: 'OVERDUE',
      },
    });

    const response = await request(app.server)
      .get(`/v1/finance/entries/${entry.id}/escalation-history`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('actions');
    expect(Array.isArray(response.body.actions)).toBe(true);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/finance/entries/00000000-0000-0000-0000-000000000000/escalation-history',
    );
    expect(response.status).toBe(401);
  });
});
