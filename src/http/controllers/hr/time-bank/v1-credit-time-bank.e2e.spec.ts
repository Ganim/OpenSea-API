import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Credit Time Bank (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to credit hours to time bank', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .post('/v1/hr/time-bank/credit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        hours: 5,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeBank');
    expect(response.body.timeBank.balance).toBe(5);
  });

  it('should accumulate credits', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    // Create initial time bank
    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 10,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/credit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        hours: 5,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.timeBank.balance).toBe(15);
  });

  it('should NOT allow USER to credit time bank', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .post('/v1/hr/time-bank/credit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        hours: 5,
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post('/v1/hr/time-bank/credit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId: nonExistentUUID,
        hours: 5,
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .post('/v1/hr/time-bank/credit')
      .send({
        employeeId: validUUID,
        hours: 5,
      });

    expect(response.statusCode).toBe(401);
  });
});
