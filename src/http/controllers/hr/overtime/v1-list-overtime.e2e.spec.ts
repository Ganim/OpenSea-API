import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Overtime (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list overtime requests', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    // Create overtime requests
    await prisma.overtime.createMany({
      data: [
        {
          employeeId,
          date: new Date('2024-01-15'),
          hours: 2,
          reason: 'Project deadline',
          approved: false,
        },
        {
          employeeId,
          date: new Date('2024-01-16'),
          hours: 3,
          reason: 'Client meeting',
          approved: true,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/overtime')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body).toHaveProperty('total');
    expect(response.body.overtime).toBeInstanceOf(Array);
  });

  it('should filter overtime by employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId: employee1Id } = await createEmployeeE2E();
    const { employeeId: employee2Id } = await createEmployeeE2E();

    await prisma.overtime.createMany({
      data: [
        {
          employeeId: employee1Id,
          date: new Date('2024-01-15'),
          hours: 2,
          reason: 'Project deadline',
          approved: false,
        },
        {
          employeeId: employee2Id,
          date: new Date('2024-01-16'),
          hours: 3,
          reason: 'Client meeting',
          approved: false,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/overtime')
      .set('Authorization', `Bearer ${token}`)
      .query({ employeeId: employee1Id });

    expect(response.statusCode).toBe(200);
    expect(
      response.body.overtime.every(
        (o: { employeeId: string }) => o.employeeId === employee1Id,
      ),
    ).toBe(true);
  });

  it('should filter by approval status', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    await prisma.overtime.createMany({
      data: [
        {
          employeeId,
          date: new Date('2024-01-15'),
          hours: 2,
          reason: 'Project deadline',
          approved: false,
        },
        {
          employeeId,
          date: new Date('2024-01-16'),
          hours: 3,
          reason: 'Client meeting',
          approved: true,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/overtime')
      .set('Authorization', `Bearer ${token}`)
      .query({ approved: true });

    expect(response.statusCode).toBe(200);
    expect(
      response.body.overtime.every((o: { approved: boolean }) => o.approved),
    ).toBe(true);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/overtime');

    expect(response.statusCode).toBe(401);
  });
});
