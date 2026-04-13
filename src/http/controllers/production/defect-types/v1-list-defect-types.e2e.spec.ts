import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Defect Types (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const ts = Date.now();
    await prisma.productionDefectType.createMany({
      data: [
        {
          tenantId,
          code: `LDT-A-${ts}`,
          name: `List Defect A ${ts}`,
          severity: 'CRITICAL',
          isActive: true,
        },
        {
          tenantId,
          code: `LDT-B-${ts}`,
          name: `List Defect B ${ts}`,
          severity: 'MINOR',
          isActive: true,
        },
      ],
    });
  });

  it('should list defect types', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/production/defect-types')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('defectTypes');
    expect(Array.isArray(response.body.defectTypes)).toBe(true);
    expect(response.body.defectTypes.length).toBeGreaterThanOrEqual(2);
  });
});
