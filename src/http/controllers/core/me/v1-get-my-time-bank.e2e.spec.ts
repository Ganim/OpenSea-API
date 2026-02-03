import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get My Time Bank (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get my time bank with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const { employee } = await createEmployeeE2E({
      tenantId,
      userId: user.user.id,
      fullName: 'Time Bank Test Employee',
    });

    await prisma.timeBank.create({
      data: {
        tenantId,
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
