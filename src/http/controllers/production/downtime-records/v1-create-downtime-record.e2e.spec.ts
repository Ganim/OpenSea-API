import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Downtime Record (E2E)', () => {
  let tenantId: string;
  let workstationId: string;
  let downtimeReasonId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const ts = Date.now();

    const wsType = await prisma.productionWorkstationType.create({
      data: {
        tenantId,
        name: `WS Type CDR ${ts}`,
        isActive: true,
      },
    });

    const workstation = await prisma.productionWorkstation.create({
      data: {
        tenantId,
        workstationTypeId: wsType.id,
        code: `WS-CDR-${ts}`,
        name: `Workstation CDR ${ts}`,
        capacityPerDay: 8,
        isActive: true,
      },
    });
    workstationId = workstation.id;

    const reason = await prisma.productionDowntimeReason.create({
      data: {
        tenantId,
        code: `CDR-R-${ts}`,
        name: `Reason CDR ${ts}`,
        category: 'MACHINE',
        isActive: true,
      },
    });
    downtimeReasonId = reason.id;
  });

  it('should create a downtime record', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const startTime = new Date().toISOString();

    const response = await request(app.server)
      .post('/v1/production/downtime-records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        workstationId,
        downtimeReasonId,
        startTime,
        notes: 'Machine broke down during production',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('downtimeRecord');
    expect(response.body.downtimeRecord).toHaveProperty('id');
    expect(response.body.downtimeRecord.workstationId).toBe(workstationId);
    expect(response.body.downtimeRecord.downtimeReasonId).toBe(
      downtimeReasonId,
    );
    expect(response.body.downtimeRecord.notes).toBe(
      'Machine broke down during production',
    );
  });
});
