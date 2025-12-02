import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAbsenceE2E } from '@/utils/tests/factories/hr/create-absence.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Approve Absence (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should approve a pending absence', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { absenceId } = await createAbsenceE2E({
      employeeId,
      status: 'PENDING',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/absences/${absenceId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(200);
    expect(response.body.absence).toBeDefined();
    expect(response.body.absence.status).toBe('APPROVED');
    expect(response.body.absence.approvedAt).toBeDefined();
    expect(response.body.absence.approvedBy).toBeDefined();
  });

  it('should not approve non-pending absence', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { absenceId } = await createAbsenceE2E({
      employeeId,
      status: 'APPROVED',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/absences/${absenceId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 for non-existent absence', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .patch('/v1/hr/absences/00000000-0000-0000-0000-000000000000/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/absences/00000000-0000-0000-0000-000000000000/approve')
      .send({});

    expect(response.statusCode).toBe(401);
  });
});
