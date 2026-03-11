import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Export Absences Report (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should export absences report as CSV', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['reports.hr.absences'],
    });

    const response = await request(app.server)
      .get('/v1/hr/reports/absences')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
  });
});
