import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAbsenceE2E } from '@/utils/tests/factories/hr/create-absence.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Absence (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get absence by id', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { absenceId } = await createAbsenceE2E({
      employeeId,
      type: 'VACATION',
      reason: 'Test vacation',
    });

    const response = await request(app.server)
      .get(`/v1/hr/absences/${absenceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.absence).toBeDefined();
    expect(response.body.absence.id).toBe(absenceId);
    expect(response.body.absence.employeeId).toBe(employeeId);
    expect(response.body.absence.type).toBe('VACATION');
  });

  it('should return 404 for non-existent absence', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .get('/v1/hr/absences/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get(
      '/v1/hr/absences/00000000-0000-0000-0000-000000000000',
    );

    expect(response.statusCode).toBe(401);
  });
});
