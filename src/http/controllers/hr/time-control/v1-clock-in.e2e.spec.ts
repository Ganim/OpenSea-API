import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Clock In (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register clock in successfully', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .post('/v1/hr/time-control/clock-in')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        notes: 'Starting work',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('timeEntry');
    expect(response.body.timeEntry.entryType).toBe('CLOCK_IN');
    expect(response.body.timeEntry.employeeId).toBe(employeeId);
  });

  it('should register clock in with geolocation', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .post('/v1/hr/time-control/clock-in')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        latitude: -23.5505,
        longitude: -46.6333,
        ipAddress: '192.168.1.1',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.timeEntry.latitude).toBe(-23.5505);
    expect(response.body.timeEntry.longitude).toBe(-46.6333);
    expect(response.body.timeEntry.ipAddress).toBe('192.168.1.1');
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .post('/v1/hr/time-control/clock-in')
      .send({
        employeeId: validUUID,
      });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post('/v1/hr/time-control/clock-in')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId: nonExistentUUID,
      });

    expect(response.statusCode).toBe(404);
  });
});
