import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('End Time Entry (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let timeEntryId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });

    // Create an open time entry (no endTime)
    const timeEntry = await prisma.productionTimeEntry.create({
      data: {
        jobCardId: data.jobCard.id,
        operatorId: userId,
        startTime: new Date(Date.now() - 3600000),
        breakMinutes: 0,
        entryType: 'PRODUCTION',
      },
    });
    timeEntryId = timeEntry.id;
  });

  it('should end a time entry', async () => {
    const response = await request(app.server)
      .patch(`/v1/production/time-entries/${timeEntryId}/end`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        endTime: new Date().toISOString(),
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('timeEntry');
    expect(response.body.timeEntry.id).toBe(timeEntryId);
    expect(response.body.timeEntry.endTime).toBeTruthy();
  });
});
