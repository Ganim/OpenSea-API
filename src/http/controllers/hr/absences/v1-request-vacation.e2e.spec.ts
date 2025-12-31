import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createAvailableVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Request Vacation (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to request vacation', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
      remainingDays: 30,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45); // 45 dias no futuro (> 30 dias antecedência)
    const endDate = new Date(startDate.getTime() + 9 * 24 * 60 * 60 * 1000); // 10 dias depois

    const response = await request(app.server)
      .post('/v1/hr/absences/vacation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        vacationPeriodId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'Férias programadas',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.absence).toBeDefined();
    expect(response.body.absence.type).toBe('VACATION');
    expect(response.body.absence.status).toBe('PENDING');
    expect(response.body.absence.employeeId).toBe(employeeId);
  });

  it('should not request vacation for inactive employee', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E({ status: 'TERMINATED' });
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45);
    const endDate = new Date(startDate.getTime() + 9 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/hr/absences/vacation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        vacationPeriodId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should not request vacation without 30 days advance notice', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 15); // Apenas 15 dias de antecedência
    const endDate = new Date(startDate.getTime() + 9 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/hr/absences/vacation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        vacationPeriodId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should not request vacation with less than 5 days', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45);
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000); // Apenas 3 dias

    const response = await request(app.server)
      .post('/v1/hr/absences/vacation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        vacationPeriodId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 401 when no token is provided', async () => {
    // Cria dados reais no banco para que a validação passe
    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45);
    const endDate = new Date(startDate.getTime() + 9 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/hr/absences/vacation')
      .send({
        employeeId,
        vacationPeriodId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.statusCode).toBe(401);
  });
});
