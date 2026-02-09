import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Work Schedule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a work schedule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/hr/work-schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Standard Schedule ${timestamp}`,
        description: 'Regular 8-hour workday',
        mondayStart: '08:00',
        mondayEnd: '17:00',
        tuesdayStart: '08:00',
        tuesdayEnd: '17:00',
        wednesdayStart: '08:00',
        wednesdayEnd: '17:00',
        thursdayStart: '08:00',
        thursdayEnd: '17:00',
        fridayStart: '08:00',
        fridayEnd: '17:00',
        breakDuration: 60,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('workSchedule');
    expect(response.body.workSchedule.name).toBe(
      `Standard Schedule ${timestamp}`,
    );
    expect(response.body.workSchedule.breakDuration).toBe(60);
  });

  it('should NOT allow user without permission to create a work schedule', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .post('/v1/hr/work-schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Schedule',
        breakDuration: 60,
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server)
      .post('/v1/hr/work-schedules')
      .send({
        name: 'Test Schedule',
        breakDuration: 60,
      });

    expect(response.statusCode).toBe(401);
  });

  it('should validate time format', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/work-schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Invalid Schedule',
        mondayStart: 'invalid-time',
        breakDuration: 60,
      });

    expect(response.statusCode).toBe(400);
  });
});
