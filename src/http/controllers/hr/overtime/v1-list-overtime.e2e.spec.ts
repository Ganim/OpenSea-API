import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Overtime (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list overtime requests with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    await prisma.overtime.createMany({
      data: [
        {
          employeeId,
          date: new Date('2024-01-15'),
          hours: 2,
          reason: 'Project deadline',
          approved: false,
        },
        {
          employeeId,
          date: new Date('2024-01-16'),
          hours: 3,
          reason: 'Client meeting',
          approved: true,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/overtime')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body).toHaveProperty('total');
    expect(response.body.overtime).toBeInstanceOf(Array);
  });
});
