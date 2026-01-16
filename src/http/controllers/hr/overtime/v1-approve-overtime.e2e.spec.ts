import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Approve Overtime (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should approve overtime with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date('2024-01-15'),
        hours: 2,
        reason: 'Project deadline',
        approved: false,
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/overtime/${overtime.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        addToTimeBank: false,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body.overtime.approved).toBe(true);
  });
});
