import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Clock Out (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register clock out with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(Date.now() - 3600000),
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-control/clock-out')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        notes: 'Ending work',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('timeEntry');
    expect(response.body.timeEntry.entryType).toBe('CLOCK_OUT');
    expect(response.body.timeEntry.employeeId).toBe(employeeId);
  });
});
