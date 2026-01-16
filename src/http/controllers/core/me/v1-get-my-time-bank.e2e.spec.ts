import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get My Time Bank (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get my time bank with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const { employee } = await createEmployeeE2E({
      userId: user.user.id,
      fullName: 'Time Bank Test Employee',
    });

    await prisma.timeBank.create({
      data: {
        employeeId: employee.id,
        balance: 480,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .get('/v1/me/time-bank')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('timeBank');
  });
});
