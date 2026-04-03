import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Shift (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should delete a shift', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const createResponse = await request(app.server)
      .post('/v1/hr/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Del Shift ${Date.now()}`,
        type: 'FIXED',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
      });

    const shiftId = createResponse.body.shift.id;

    const response = await request(app.server)
      .delete(`/v1/hr/shifts/${shiftId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .delete('/v1/hr/shifts/nonexistent-id');

    expect(response.statusCode).toBe(401);
  });
});
