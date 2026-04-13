import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Production Entries (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let jobCardId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    jobCardId = data.jobCard.id;

    await prisma.productionEntry.create({
      data: {
        jobCardId,
        operatorId: userId,
        quantityGood: 20,
        quantityScrapped: 1,
        quantityRework: 0,
      },
    });
  });

  it('should list production entries by job card', async () => {
    const response = await request(app.server)
      .get('/v1/production/production-entries')
      .query({ jobCardId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productionEntries');
    expect(Array.isArray(response.body.productionEntries)).toBe(true);
    expect(response.body.productionEntries.length).toBeGreaterThanOrEqual(1);
  });
});
