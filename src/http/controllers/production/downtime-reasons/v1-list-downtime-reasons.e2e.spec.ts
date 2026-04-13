import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Downtime Reasons (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const ts = Date.now();
    await prisma.productionDowntimeReason.createMany({
      data: [
        {
          tenantId,
          code: `LDR-A-${ts}`,
          name: `List Downtime A ${ts}`,
          category: 'MACHINE',
          isActive: true,
        },
        {
          tenantId,
          code: `LDR-B-${ts}`,
          name: `List Downtime B ${ts}`,
          category: 'QUALITY',
          isActive: true,
        },
      ],
    });
  });

  it('should list downtime reasons', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/production/downtime-reasons')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('downtimeReasons');
    expect(Array.isArray(response.body.downtimeReasons)).toBe(true);
    expect(response.body.downtimeReasons.length).toBeGreaterThanOrEqual(2);
  });
});
