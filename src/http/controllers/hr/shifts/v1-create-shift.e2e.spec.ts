import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Shift (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a shift', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Morning Shift ${Date.now()}`,
        type: 'FIXED',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        isNightShift: false,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('shift');
    expect(response.body.shift).toHaveProperty('id');
    expect(response.body.shift.type).toBe('FIXED');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post('/v1/hr/shifts').send({
      name: 'Test Shift',
      type: 'FIXED',
      startTime: '08:00',
      endTime: '17:00',
    });

    expect(response.statusCode).toBe(401);
  });
});
