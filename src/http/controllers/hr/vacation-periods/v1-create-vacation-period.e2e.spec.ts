import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Vacation Period (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a vacation period with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const acquisitionStart = new Date('2023-01-01');
    const acquisitionEnd = new Date('2023-12-31');
    const concessionStart = new Date('2024-01-01');
    const concessionEnd = new Date('2024-12-31');

    const response = await request(app.server)
      .post('/v1/hr/vacation-periods')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        acquisitionStart: acquisitionStart.toISOString(),
        acquisitionEnd: acquisitionEnd.toISOString(),
        concessionStart: concessionStart.toISOString(),
        concessionEnd: concessionEnd.toISOString(),
        totalDays: 30,
        notes: 'Período aquisitivo 2023',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.vacationPeriod).toBeDefined();
    expect(response.body.vacationPeriod.employeeId).toBe(employeeId);
    expect(response.body.vacationPeriod.totalDays).toBe(30);
    expect(response.body.vacationPeriod.remainingDays).toBe(30);
    expect(response.body.vacationPeriod.status).toBe('AVAILABLE');
  });
});
