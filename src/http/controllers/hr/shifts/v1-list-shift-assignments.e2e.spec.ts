import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Shift Assignments (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list assignments for a shift', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create shift
    const shiftRes = await request(app.server)
      .post('/v1/hr/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `List Asgn Shift ${Date.now()}`,
        type: 'FIXED',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
      });

    const shiftId = shiftRes.body.shift.id;

    const response = await request(app.server)
      .get(`/v1/hr/shifts/${shiftId}/assignments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('shiftAssignments');
    expect(Array.isArray(response.body.shiftAssignments)).toBe(true);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .get('/v1/hr/shifts/nonexistent-id/assignments');

    expect(response.statusCode).toBe(401);
  });
});
