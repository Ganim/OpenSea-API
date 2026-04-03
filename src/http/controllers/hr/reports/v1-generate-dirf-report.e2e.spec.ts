import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Generate DIRF Report (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });


  it('should generate DIRF report as JSON', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.reports.export'],
    });

    const response = await request(app.server)
      .post('/v1/hr/reports/dirf')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2024 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('year', 2024);
    expect(response.body).toHaveProperty('totalEmployees');
    expect(response.body).toHaveProperty('totalIrrfWithheld');
    expect(response.body).toHaveProperty('totalGrossIncome');
    expect(response.body).toHaveProperty('employees');
  });
});
