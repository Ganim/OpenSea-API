import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Export Payroll Report (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  it('should export payroll report as CSV', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['reports.hr.generate'],
    });

    const response = await request(app.server)
      .get('/v1/hr/reports/payroll')
      .query({ referenceMonth: 3, referenceYear: 2024 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
  });
});
