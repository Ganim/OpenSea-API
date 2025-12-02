import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Adjust Time Bank (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to adjust time bank balance', async () => {
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
      .post('/v1/hr/time-bank/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        newBalance: 25,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeBank');
    expect(response.body.timeBank.balance).toBe(25);
  });

  it('should allow setting balance to zero', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 15,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        newBalance: 0,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.timeBank.balance).toBe(0);
  });

  it('should allow setting negative balance', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 5,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        newBalance: -10,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.timeBank.balance).toBe(-10);
    expect(response.body.timeBank.hasNegativeBalance).toBe(true);
  });

  it('should adjust time bank for specific year', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 20,
        year: 2023,
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        newBalance: 30,
        year: 2023,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.timeBank.year).toBe(2023);
    expect(response.body.timeBank.balance).toBe(30);
  });

  it('should allow ADMIN to adjust time bank', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const { employeeId } = await createEmployeeE2E();

    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 8,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        newBalance: 50,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.timeBank.balance).toBe(50);
  });

  it('should NOT allow USER to adjust time bank', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 10,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        newBalance: 100,
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post('/v1/hr/time-bank/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId: nonExistentUUID,
        newBalance: 10,
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .post('/v1/hr/time-bank/adjust')
      .send({
        employeeId: validUUID,
        newBalance: 10,
      });

    expect(response.statusCode).toBe(401);
  });
});
