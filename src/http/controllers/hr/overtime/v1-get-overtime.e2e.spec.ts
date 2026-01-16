import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Overtime (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get overtime by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date('2024-01-15'),
        hours: 2.5,
        reason: 'Project deadline meeting',
        approved: false,
      },
    });

    const response = await request(app.server)
      .get(`/v1/hr/overtime/${overtime.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body.overtime.id).toBe(overtime.id);
    expect(response.body.overtime.employeeId).toBe(employeeId);
    expect(response.body.overtime.hours).toBe(2.5);
  });
});
