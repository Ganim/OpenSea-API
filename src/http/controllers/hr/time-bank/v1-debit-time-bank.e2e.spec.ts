import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Debit Time Bank (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to debit hours from time bank', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    // Create time bank with balance
    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 10,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/debit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        hours: 5,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeBank');
    expect(response.body.timeBank.balance).toBe(5);
  });

  it('should allow negative balance (company policy)', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    // Create time bank with small balance
    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 2,
        year: new Date().getFullYear(),
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/debit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        hours: 10,
      });

    // System allows negative balance per company policy
    expect(response.statusCode).toBe(200);
    expect(response.body.timeBank.balance).toBe(-8);
  });

  it('should NOT allow USER to debit time bank', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .post('/v1/hr/time-bank/debit')
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
      .post('/v1/hr/time-bank/debit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId: nonExistentUUID,
        hours: 5,
      });

    expect(response.statusCode).toBe(404);
  });
});
