import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('End Downtime Record (E2E)', () => {
  let tenantId: string;
  let downtimeRecordId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const ts = Date.now();

    const wsType = await prisma.productionWorkstationType.create({
      data: {
        tenantId,
        name: `WS Type EDR ${ts}`,
        isActive: true,
      },
    });

    const workstation = await prisma.productionWorkstation.create({
      data: {
        tenantId,
        workstationTypeId: wsType.id,
        code: `WS-EDR-${ts}`,
        name: `Workstation EDR ${ts}`,
        capacityPerDay: 8,
        isActive: true,
      },
    });

    const reason = await prisma.productionDowntimeReason.create({
      data: {
        tenantId,
        code: `EDR-R-${ts}`,
        name: `Reason EDR ${ts}`,
        category: 'MAINTENANCE',
        isActive: true,
      },
    });

    const record = await prisma.productionDowntimeRecord.create({
      data: {
        workstationId: workstation.id,
        downtimeReasonId: reason.id,
        startTime: new Date(Date.now() - 3600000),
        reportedById: randomUUID(),
      },
    });
    downtimeRecordId = record.id;
  });

  it('should end a downtime record', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(`/v1/production/downtime-records/${downtimeRecordId}/end`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        endTime: new Date().toISOString(),
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('downtimeRecord');
    expect(response.body.downtimeRecord.endTime).toBeTruthy();
  });
});
