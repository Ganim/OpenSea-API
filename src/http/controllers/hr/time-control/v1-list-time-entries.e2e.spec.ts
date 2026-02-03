import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Time Entries (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list time entries with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    await prisma.timeEntry.createMany({
      data: [
        {
          tenantId,
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date('2024-01-15T08:00:00'),
        },
        {
          tenantId,
          employeeId,
          entryType: 'CLOCK_OUT',
          timestamp: new Date('2024-01-15T17:00:00'),
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/time-control/entries')
      .set('Authorization', `Bearer ${token}`)
      .query({ employeeId });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeEntries');
    expect(response.body).toHaveProperty('total');
    expect(response.body.timeEntries).toBeInstanceOf(Array);
  });
});
