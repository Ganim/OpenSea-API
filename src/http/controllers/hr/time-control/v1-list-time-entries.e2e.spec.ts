import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Time Entries (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list time entries', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    // Create some time entries
    await prisma.timeEntry.createMany({
      data: [
        {
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date('2024-01-15T08:00:00'),
        },
        {
          employeeId,
          entryType: 'CLOCK_OUT',
          timestamp: new Date('2024-01-15T17:00:00'),
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/time-control/entries')
      .set('Authorization', `Bearer ${token}`)
      .query({ employeeId });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeEntries');
    expect(response.body).toHaveProperty('total');
    expect(response.body.timeEntries).toBeInstanceOf(Array);
  });

  it('should filter time entries by date range', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    // Create time entries
    await prisma.timeEntry.createMany({
      data: [
        {
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date('2024-01-15T08:00:00'),
        },
        {
          employeeId,
          entryType: 'CLOCK_OUT',
          timestamp: new Date('2024-01-15T17:00:00'),
        },
        {
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date('2024-02-15T08:00:00'),
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/time-control/entries')
      .set('Authorization', `Bearer ${token}`)
      .query({
        employeeId,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.timeEntries.length).toBe(2);
  });

  it('should list all time entries for employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    // Create many time entries
    const entries = Array.from({ length: 10 }, (_, i) => ({
      employeeId,
      entryType: i % 2 === 0 ? 'CLOCK_IN' : 'CLOCK_OUT',
      timestamp: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T08:00:00`),
    }));

    await prisma.timeEntry.createMany({
      data: entries as Array<{
        employeeId: string;
        entryType: 'CLOCK_IN' | 'CLOCK_OUT';
        timestamp: Date;
      }>,
    });

    const response = await request(app.server)
      .get('/v1/hr/time-control/entries')
      .set('Authorization', `Bearer ${token}`)
      .query({
        employeeId,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.timeEntries.length).toBe(10);
    expect(response.body.total).toBe(10);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get(
      '/v1/hr/time-control/entries',
    );

    expect(response.statusCode).toBe(401);
  });
});
