import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Time Entry (E2E)', () => {
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
  });

  it('should create a time entry', async () => {
    const startTime = new Date();
    const endTime = new Date(Date.now() + 3600000); // 1 hour later

    const response = await request(app.server)
      .post('/v1/production/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobCardId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        breakMinutes: 15,
        entryType: 'PRODUCTION',
        notes: 'Regular production shift',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('timeEntry');
    expect(response.body.timeEntry).toHaveProperty('id');
    expect(response.body.timeEntry.jobCardId).toBe(jobCardId);
    expect(response.body.timeEntry.entryType).toBe('PRODUCTION');
    expect(response.body.timeEntry.breakMinutes).toBe(15);
  });
});
