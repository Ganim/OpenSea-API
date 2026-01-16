import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateCIDCode } from '@/utils/tests/factories/hr/create-absence.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Request Sick Leave (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should request sick leave with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/hr/absences/sick-leave')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cid: generateCIDCode(),
        reason: 'Atestado médico por consulta',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('absence');
  });
});
