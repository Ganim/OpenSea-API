import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Downtime Records (E2E)', () => {
  let tenantId: string;
  let workstationId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const ts = Date.now();

    const wsType = await prisma.productionWorkstationType.create({
      data: {
        tenantId,
        name: `WS Type LDR ${ts}`,
        isActive: true,
      },
    });

    const workstation = await prisma.productionWorkstation.create({
      data: {
        tenantId,
        workstationTypeId: wsType.id,
        code: `WS-LDR-${ts}`,
        name: `Workstation LDR ${ts}`,
        capacityPerDay: 8,
        isActive: true,
      },
    });
    workstationId = workstation.id;

    const reason = await prisma.productionDowntimeReason.create({
      data: {
        tenantId,
        code: `LDR-R-${ts}`,
        name: `Reason LDR ${ts}`,
        category: 'QUALITY',
        isActive: true,
      },
    });

    await prisma.productionDowntimeRecord.createMany({
      data: [
        {
          workstationId,
          downtimeReasonId: reason.id,
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(),
          durationMinutes: 60,
          reportedById: randomUUID(),
        },
        {
          workstationId,
          downtimeReasonId: reason.id,
          startTime: new Date(Date.now() - 7200000),
          endTime: new Date(Date.now() - 3600000),
          durationMinutes: 60,
          reportedById: randomUUID(),
        },
      ],
    });
  });

  it('should list downtime records for a workstation', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/production/downtime-records')
      .query({ workstationId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('downtimeRecords');
    expect(Array.isArray(response.body.downtimeRecords)).toBe(true);
    expect(response.body.downtimeRecords.length).toBeGreaterThanOrEqual(2);
  });
});
