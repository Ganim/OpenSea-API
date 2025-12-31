import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Work Schedule (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to update a work schedule', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const workSchedule = await prisma.workSchedule.create({
      data: {
        name: `Original Schedule ${timestamp}`,
        breakDuration: 60,
        mondayStart: '08:00',
        mondayEnd: '17:00',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Schedule ${timestamp}`,
        breakDuration: 45,
        mondayStart: '09:00',
        mondayEnd: '18:00',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('workSchedule');
    expect(response.body.workSchedule.name).toBe(
      `Updated Schedule ${timestamp}`,
    );
    expect(response.body.workSchedule.breakDuration).toBe(45);
    expect(response.body.workSchedule.mondayStart).toBe('09:00');
  });

  it('should allow ADMIN to update a work schedule', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const workSchedule = await prisma.workSchedule.create({
      data: {
        name: `Admin Schedule ${timestamp}`,
        breakDuration: 60,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Admin Updated Schedule ${timestamp}`,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.workSchedule.name).toBe(
      `Admin Updated Schedule ${timestamp}`,
    );
  });

  it('should NOT allow user without permission to update a work schedule', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const workSchedule = await prisma.workSchedule.create({
      data: {
        name: 'User Test Schedule',
        breakDuration: 60,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated by User',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 for non-existent schedule', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/hr/work-schedules/${nonExistentUUID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Schedule',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should validate time format on update', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const workSchedule = await prisma.workSchedule.create({
      data: {
        name: 'Time Format Test',
        breakDuration: 60,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mondayStart: 'invalid-time',
      });

    expect(response.statusCode).toBe(400);
  });

  it('should allow deactivating a schedule', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const workSchedule = await prisma.workSchedule.create({
      data: {
        name: 'Deactivate Test',
        breakDuration: 60,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.workSchedule.isActive).toBe(false);
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .put(`/v1/hr/work-schedules/${validUUID}`)
      .send({
        name: 'Updated',
      });

    expect(response.statusCode).toBe(401);
  });
});
