import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Delete Defect Type (E2E)', () => {
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
        code: `DDT-${ts}`,
        name: `Delete Defect ${ts}`,
        severity: 'MINOR',
        isActive: true,
      },
    });
    defectTypeId = defectType.id;
  });

  it('should delete a defect type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete(`/v1/production/defect-types/${defectTypeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
