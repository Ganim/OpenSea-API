import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Work Schedule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to delete a work schedule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const workSchedule = await prisma.workSchedule.create({
      data: {
        tenantId,
        name: 'To Delete Schedule',
        breakDuration: 60,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);

    // Verify schedule was deleted
    const deletedSchedule = await prisma.workSchedule.findUnique({
      where: { id: workSchedule.id },
    });
    expect(deletedSchedule).toBeNull();
  });

  it('should allow ADMIN to delete a work schedule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const workSchedule = await prisma.workSchedule.create({
      data: {
        tenantId,
        name: 'Admin Delete Schedule',
        breakDuration: 60,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should NOT allow user without permission to delete a work schedule', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const workSchedule = await prisma.workSchedule.create({
      data: {
        tenantId,
        name: 'User Cannot Delete',
        breakDuration: 60,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);

    // Verify schedule still exists
    const schedule = await prisma.workSchedule.findUnique({
      where: { id: workSchedule.id },
    });
    expect(schedule).not.toBeNull();
  });

  it('should return 404 for non-existent schedule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/hr/work-schedules/${nonExistentUUID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server).delete(
      `/v1/hr/work-schedules/${validUUID}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
