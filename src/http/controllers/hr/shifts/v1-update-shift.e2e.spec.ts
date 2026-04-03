import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Shift (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should update a shift', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const createResponse = await request(app.server)
      .post('/v1/hr/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Upd Shift ${Date.now()}`,
        type: 'FIXED',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
      });

    const shiftId = createResponse.body.shift.id;

    const response = await request(app.server)
      .put(`/v1/hr/shifts/${shiftId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Shift Name',
        breakMinutes: 30,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('shift');
    expect(response.body.shift.name).toBe('Updated Shift Name');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/hr/shifts/nonexistent-id')
      .send({ name: 'Test' });

    expect(response.statusCode).toBe(401);
  });
});
