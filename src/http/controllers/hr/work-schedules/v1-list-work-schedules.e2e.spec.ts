import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Work Schedules (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list work schedules', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    // Create test work schedules
    await prisma.workSchedule.createMany({
      data: [
        {
          name: 'Schedule 1',
          breakDuration: 60,
          isActive: true,
        },
        {
          name: 'Schedule 2',
          breakDuration: 45,
          isActive: true,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/work-schedules')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('workSchedules');
    expect(response.body.workSchedules).toBeInstanceOf(Array);
  });

  it('should filter only active schedules', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    // Create schedules with different statuses
    await prisma.workSchedule.createMany({
      data: [
        {
          name: 'Active Schedule',
          breakDuration: 60,
          isActive: true,
        },
        {
          name: 'Inactive Schedule',
          breakDuration: 60,
          isActive: false,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/work-schedules')
      .set('Authorization', `Bearer ${token}`)
      .query({ activeOnly: true });

    expect(response.statusCode).toBe(200);
    const activeSchedules = response.body.workSchedules.filter(
      (s: { isActive: boolean }) => s.isActive,
    );
    expect(activeSchedules.length).toBe(response.body.workSchedules.length);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/work-schedules');

    expect(response.statusCode).toBe(401);
  });
});
