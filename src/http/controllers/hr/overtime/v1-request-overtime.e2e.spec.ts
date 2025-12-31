import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Request Overtime (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an overtime request', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .post('/v1/hr/overtime')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        date: '2024-01-15',
        hours: 2,
        reason: 'Project deadline - need extra hours to complete delivery',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body.overtime.employeeId).toBe(employeeId);
    expect(response.body.overtime.hours).toBe(2);
    expect(response.body.overtime.approved).toBe(false);
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post('/v1/hr/overtime')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId: nonExistentUUID,
        date: '2024-01-15',
        hours: 2,
        reason: 'Some reason for overtime work request',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when reason is too short', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .post('/v1/hr/overtime')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        date: '2024-01-15',
        hours: 2,
        reason: 'Short', // Too short - needs at least 10 characters
      });

    expect(response.statusCode).toBe(400);
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server).post('/v1/hr/overtime').send({
      employeeId: validUUID,
      date: '2024-01-15',
      hours: 2,
      reason: 'Some reason for overtime work request',
    });

    expect(response.statusCode).toBe(401);
  });
});
