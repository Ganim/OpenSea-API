import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Time Banks (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list all time banks with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId: emp1 } = await createEmployeeE2E({ tenantId });
    const { employeeId: emp2 } = await createEmployeeE2E({ tenantId });

    await prisma.timeBank.createMany({
      data: [
        { tenantId, employeeId: emp1, balance: 10, year: 2024 },
        { tenantId, employeeId: emp2, balance: 15, year: 2024 },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/time-bank')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeBanks');
    expect(response.body.timeBanks).toBeInstanceOf(Array);
  });
});
