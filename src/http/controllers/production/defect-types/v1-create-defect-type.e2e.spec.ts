import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Defect Type (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a defect type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/production/defect-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `DT-${ts}`,
        name: `Defect Type ${ts}`,
        description: 'Test defect type description',
        severity: 'MAJOR',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('defectType');
    expect(response.body.defectType).toHaveProperty('id');
    expect(response.body.defectType.code).toBe(`DT-${ts}`);
    expect(response.body.defectType.name).toBe(`Defect Type ${ts}`);
    expect(response.body.defectType.severity).toBe('MAJOR');
    expect(response.body.defectType.isActive).toBe(true);
  });
});
