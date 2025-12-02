import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Time Bank (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get employee time bank', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    // Create time bank
    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 10,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .get(`/v1/hr/time-bank/${employeeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeBank');
    expect(response.body.timeBank.employeeId).toBe(employeeId);
    expect(response.body.timeBank.balance).toBe(10);
  });

  it('should create time bank if not exists', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .get(`/v1/hr/time-bank/${employeeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.timeBank.balance).toBe(0);
  });

  it('should get time bank for specific year', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 20,
        year: 2023,
      },
    });

    const response = await request(app.server)
      .get(`/v1/hr/time-bank/${employeeId}`)
      .set('Authorization', `Bearer ${token}`)
      .query({ year: 2023 });

    expect(response.statusCode).toBe(200);
    expect(response.body.timeBank.year).toBe(2023);
    expect(response.body.timeBank.balance).toBe(20);
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server).get(
      `/v1/hr/time-bank/${validUUID}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
