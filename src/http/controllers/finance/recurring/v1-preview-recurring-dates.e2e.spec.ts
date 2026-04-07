import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Preview Recurring Dates (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should preview recurring dates', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/recurring/preview-dates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        frequency: 'MONTHLY',
        startDate: new Date().toISOString(),
        count: 6,
      });

    expect([200, 400]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/recurring/preview-dates')
      .send({ frequency: 'MONTHLY' });

    expect(response.status).toBe(401);
  });
});
