import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Update Downtime Reason (E2E)', () => {
  let tenantId: string;
  let downtimeReasonId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const ts = Date.now();
    const reason = await prisma.productionDowntimeReason.create({
      data: {
        tenantId,
        code: `UDR-${ts}`,
        name: `Update Downtime ${ts}`,
        category: 'MACHINE',
        isActive: true,
      },
    });
    downtimeReasonId = reason.id;
  });

  it('should update a downtime reason', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put(`/v1/production/downtime-reasons/${downtimeReasonId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Downtime Reason',
        category: 'MAINTENANCE',
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('downtimeReason');
    expect(response.body.downtimeReason.name).toBe('Updated Downtime Reason');
    expect(response.body.downtimeReason.category).toBe('MAINTENANCE');
    expect(response.body.downtimeReason.isActive).toBe(false);
  });
});
