import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Unassign Employee from Shift (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should unassign an employee from a shift', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    // Create shift and assign employee
    const shiftRes = await request(app.server)
      .post('/v1/hr/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Unassign Shift ${Date.now()}`,
        type: 'FIXED',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
      });

    const shiftId = shiftRes.body.shift.id;

    const assignRes = await request(app.server)
      .post(`/v1/hr/shifts/${shiftId}/assignments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: new Date().toISOString(),
      });

    const assignmentId = assignRes.body.shiftAssignment.id;

    const response = await request(app.server)
      .delete(`/v1/hr/shift-assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .delete('/v1/hr/shift-assignments/nonexistent-id');

    expect(response.statusCode).toBe(401);
  });
});
