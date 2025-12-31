import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Time Banks (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list all time banks', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId: emp1 } = await createEmployeeE2E();
    const { employeeId: emp2 } = await createEmployeeE2E();

    await prisma.timeBank.createMany({
      data: [
        { employeeId: emp1, balance: 10, year: 2024 },
        { employeeId: emp2, balance: 15, year: 2024 },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/time-bank')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeBanks');
    expect(response.body.timeBanks).toBeInstanceOf(Array);
  });

  it('should filter by employee', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();
    await createEmployeeE2E();

    await prisma.timeBank.create({
      data: {
        employeeId,
        balance: 10,
        year: 2024,
      },
    });

    const response = await request(app.server)
      .get('/v1/hr/time-bank')
      .set('Authorization', `Bearer ${token}`)
      .query({ employeeId });

    expect(response.statusCode).toBe(200);
    expect(
      response.body.timeBanks.every(
        (tb: { employeeId: string }) => tb.employeeId === employeeId,
      ),
    ).toBe(true);
  });

  it('should filter by year', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    await prisma.timeBank.createMany({
      data: [
        { employeeId, balance: 10, year: 2023 },
        { employeeId, balance: 15, year: 2024 },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/time-bank')
      .set('Authorization', `Bearer ${token}`)
      .query({ year: 2023 });

    expect(response.statusCode).toBe(200);
    expect(
      response.body.timeBanks.every((tb: { year: number }) => tb.year === 2023),
    ).toBe(true);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/time-bank');

    expect(response.statusCode).toBe(401);
  });
});
