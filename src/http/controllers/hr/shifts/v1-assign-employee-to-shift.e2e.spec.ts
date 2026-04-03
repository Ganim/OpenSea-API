import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Assign Employee to Shift (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should assign an employee to a shift', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    // Create shift
    const shiftRes = await request(app.server)
      .post('/v1/hr/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Assign Shift ${Date.now()}`,
        type: 'FIXED',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
      });

    const shiftId = shiftRes.body.shift.id;

    const response = await request(app.server)
      .post(`/v1/hr/shifts/${shiftId}/assignments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: new Date().toISOString(),
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('shiftAssignment');
    expect(response.body.shiftAssignment.shiftId).toBe(shiftId);
    expect(response.body.shiftAssignment.employeeId).toBe(employeeId);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/shifts/nonexistent-id/assignments')
      .send({
        employeeId: 'x',
        startDate: new Date().toISOString(),
      });

    expect(response.statusCode).toBe(401);
  });
});
