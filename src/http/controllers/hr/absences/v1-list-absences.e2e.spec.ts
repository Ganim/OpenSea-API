import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAbsenceE2E } from '@/utils/tests/factories/hr/create-absence.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Absences (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list absences with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E();

    // Create some absences
    await createAbsenceE2E({ employeeId, type: 'VACATION' });
    await createAbsenceE2E({ employeeId, type: 'SICK_LEAVE' });
    await createAbsenceE2E({ employeeId, type: 'PERSONAL_LEAVE' });

    const response = await request(app.server)
      .get('/v1/hr/absences')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, perPage: 10 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('absences');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.absences)).toBe(true);
    expect(response.body.meta.page).toBe(1);
  });

  it('should filter absences by employee', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E();

    await createAbsenceE2E({ employeeId });
    await createAbsenceE2E({ employeeId });

    const response = await request(app.server)
      .get('/v1/hr/absences')
      .set('Authorization', `Bearer ${token}`)
      .query({ employeeId });

    expect(response.statusCode).toBe(200);
    response.body.absences.forEach((absence: { employeeId: string }) => {
      expect(absence.employeeId).toBe(employeeId);
    });
  });

  it('should filter absences by type', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E();

    await createAbsenceE2E({ employeeId, type: 'VACATION' });
    await createAbsenceE2E({ employeeId, type: 'SICK_LEAVE' });

    const response = await request(app.server)
      .get('/v1/hr/absences')
      .set('Authorization', `Bearer ${token}`)
      .query({ type: 'VACATION' });

    expect(response.statusCode).toBe(200);
    response.body.absences.forEach((absence: { type: string }) => {
      expect(absence.type).toBe('VACATION');
    });
  });

  it('should filter absences by status', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E();

    await createAbsenceE2E({ employeeId, status: 'PENDING' });
    await createAbsenceE2E({ employeeId, status: 'APPROVED' });

    const response = await request(app.server)
      .get('/v1/hr/absences')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'PENDING' });

    expect(response.statusCode).toBe(200);
    response.body.absences.forEach((absence: { status: string }) => {
      expect(absence.status).toBe('PENDING');
    });
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/absences');

    expect(response.statusCode).toBe(401);
  });
});
