import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Clock Out (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register clock out successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    // First, clock in
    await prisma.timeEntry.create({
      data: {
        employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-control/clock-out')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        notes: 'Ending work',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('timeEntry');
    expect(response.body.timeEntry.entryType).toBe('CLOCK_OUT');
    expect(response.body.timeEntry.employeeId).toBe(employeeId);
  });

  it('should return 400 when trying to clock out without clock in', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .post('/v1/hr/time-control/clock-out')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('clock in');
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .post('/v1/hr/time-control/clock-out')
      .send({
        employeeId: validUUID,
      });

    expect(response.statusCode).toBe(401);
  });
});
