import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Calculate Worked Hours (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should calculate worked hours with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    await prisma.timeEntry.createMany({
      data: [
        {
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date('2024-01-15T08:00:00'),
        },
        {
          employeeId,
          entryType: 'CLOCK_OUT',
          timestamp: new Date('2024-01-15T17:00:00'),
        },
      ],
    });

    const response = await request(app.server)
      .post('/v1/hr/time-control/calculate-hours')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employeeId');
    expect(response.body).toHaveProperty('totalWorkedHours');
    expect(response.body).toHaveProperty('dailyBreakdown');
  });
});
