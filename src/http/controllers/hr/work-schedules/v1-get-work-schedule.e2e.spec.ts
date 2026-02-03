import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Work Schedule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get a work schedule by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const workSchedule = await prisma.workSchedule.create({
      data: {
        tenantId,
        name: 'Test Schedule',
        breakDuration: 60,
        mondayStart: '08:00',
        mondayEnd: '17:00',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/hr/work-schedules/${workSchedule.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('workSchedule');
    expect(response.body.workSchedule.id).toBe(workSchedule.id);
    expect(response.body.workSchedule.name).toBe('Test Schedule');
  });

  it('should return 404 for non-existent schedule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/hr/work-schedules/${nonExistentUUID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server).get(
      `/v1/hr/work-schedules/${validUUID}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
