import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Request My Vacation (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should request vacation for myself', { timeout: 15000 }, async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const { employee } = await createEmployeeE2E({
      userId: user.user.id,
      fullName: 'Vacation Request Employee',
    });

    const { vacationPeriodId } = await createVacationPeriodE2E({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      status: 'AVAILABLE',
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 15);

    const response = await request(app.server)
      .post('/v1/me/vacations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vacationPeriodId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'Annual vacation rest',
      });

    expect([201, 400]).toContain(response.status);

    if (response.status === 201) {
      expect(response.body).toHaveProperty('absence');
      expect(response.body.absence).toHaveProperty('id');
    }
  });

  it('should return 404 when user has no employee record', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/me/vacations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vacationPeriodId: '00000000-0000-0000-0000-000000000000',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      });

    expect(response.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).post('/v1/me/vacations').send({
      vacationPeriodId: '00000000-0000-0000-0000-000000000000',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });

    expect(response.status).toBe(401);
  });
});
