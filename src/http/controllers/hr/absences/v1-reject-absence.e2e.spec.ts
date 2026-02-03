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

  it('should reject absence with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId, employee } = await createEmployeeE2E();
    const { absenceId } = await createAbsenceE2E({
      tenantId: employee.tenantId,
      employeeId,
      status: 'PENDING',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/absences/${absenceId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Período indisponível para férias da equipe' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('absence');
  });
});
