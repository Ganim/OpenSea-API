import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Delete Downtime Reason (E2E)', () => {
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
        code: `DDR-${ts}`,
        name: `Delete Downtime ${ts}`,
        category: 'SETUP',
        isActive: true,
      },
    });
    downtimeReasonId = reason.id;
  });

  it('should delete a downtime reason', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete(`/v1/production/downtime-reasons/${downtimeReasonId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
