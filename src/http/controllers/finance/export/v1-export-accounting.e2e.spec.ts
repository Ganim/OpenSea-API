import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Export Accounting (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should export accounting data', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/export/accounting')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reportType: 'ENTRIES',
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        endDate: new Date().toISOString(),
      });

    expect(response.status).toBe(200);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/export/accounting',
    );
    expect(response.status).toBe(401);
  });
});
