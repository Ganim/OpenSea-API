import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Escalation Timeline (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should get escalation timeline for an overdue entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const category = await prisma.financeCategory.create({
      data: {
        tenantId,
        name: 'Timeline E2E Category',
        slug: `timeline-cat-${Date.now()}`,
        type: 'REVENUE',
      },
    });

    const costCenter = await prisma.costCenter.create({
      data: {
        tenantId,
        code: `TL-CC-${Date.now()}`,
        name: 'Timeline Cost Center',
      },
    });

    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 10);

    const entry = await prisma.financeEntry.create({
      data: {
        tenantId,
        type: 'RECEIVABLE',
        code: `REC-TL-${Date.now()}`,
        description: 'Timeline E2E Entry',
        categoryId: category.id,
        costCenterId: costCenter.id,
        expectedAmount: 1000,
        issueDate: new Date(),
        dueDate: pastDueDate,
        status: 'OVERDUE',
      },
    });

    const response = await request(app.server)
      .get('/v1/finance/escalations/timeline')
      .query({ entryId: entry.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('entryId', entry.id);
    expect(response.body).toHaveProperty('currentStep');
    expect(response.body).toHaveProperty('totalSteps');
    expect(response.body).toHaveProperty('steps');
    expect(Array.isArray(response.body.steps)).toBe(true);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .get('/v1/finance/escalations/timeline')
      .query({ entryId: '00000000-0000-0000-0000-000000000000' });

    expect(response.status).toBe(401);
  });
});
