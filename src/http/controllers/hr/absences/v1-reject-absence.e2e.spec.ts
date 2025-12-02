import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAbsenceE2E } from '@/utils/tests/factories/hr/create-absence.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Reject Absence (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject a pending absence', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { absenceId } = await createAbsenceE2E({
      employeeId,
      status: 'PENDING',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/absences/${absenceId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Período indisponível para férias da equipe',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.absence).toBeDefined();
    expect(response.body.absence.status).toBe('REJECTED');
    expect(response.body.absence.rejectionReason).toBe(
      'Período indisponível para férias da equipe',
    );
  });

  it('should not reject without reason', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { absenceId } = await createAbsenceE2E({
      employeeId,
      status: 'PENDING',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/absences/${absenceId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
  });

  it('should not reject non-pending absence', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { absenceId } = await createAbsenceE2E({
      employeeId,
      status: 'APPROVED',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/absences/${absenceId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Tentativa de rejeição',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 for non-existent absence', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .patch('/v1/hr/absences/00000000-0000-0000-0000-000000000000/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Test reason',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/absences/00000000-0000-0000-0000-000000000000/reject')
      .send({
        reason: 'Test reason',
      });

    expect(response.statusCode).toBe(401);
  });
});
