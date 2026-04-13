import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Update Defect Type (E2E)', () => {
  let tenantId: string;
  let defectTypeId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const ts = Date.now();
    const defectType = await prisma.productionDefectType.create({
      data: {
        tenantId,
        code: `UDT-${ts}`,
        name: `Update Defect ${ts}`,
        severity: 'MINOR',
        isActive: true,
      },
    });
    defectTypeId = defectType.id;
  });

  it('should update a defect type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put(`/v1/production/defect-types/${defectTypeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Defect Type Name',
        severity: 'CRITICAL',
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('defectType');
    expect(response.body.defectType.name).toBe('Updated Defect Type Name');
    expect(response.body.defectType.severity).toBe('CRITICAL');
    expect(response.body.defectType.isActive).toBe(false);
  });
});
