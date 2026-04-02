import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Transfer Employee Shift (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should transfer an employee to another shift', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    // Create two shifts
    const shift1Res = await request(app.server)
      .post('/v1/hr/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Shift A ${Date.now()}`,
        type: 'FIXED',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
      });

    const shift2Res = await request(app.server)
      .post('/v1/hr/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Shift B ${Date.now()}`,
        type: 'FIXED',
        startTime: '14:00',
        endTime: '22:00',
        breakMinutes: 60,
      });

    // Assign to shift 1
    await request(app.server)
      .post(`/v1/hr/shifts/${shift1Res.body.shift.id}/assignments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: new Date().toISOString(),
      });

    // Transfer to shift 2
    const response = await request(app.server)
      .post('/v1/hr/shift-assignments/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        newShiftId: shift2Res.body.shift.id,
        startDate: new Date().toISOString(),
        notes: 'Schedule change',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('shiftAssignment');
    expect(response.body.shiftAssignment.shiftId).toBe(shift2Res.body.shift.id);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/shift-assignments/transfer')
      .send({
        employeeId: 'x',
        newShiftId: 'y',
        startDate: new Date().toISOString(),
      });

    expect(response.statusCode).toBe(401);
  });
});
