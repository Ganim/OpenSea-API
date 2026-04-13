import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Defect Record (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let defectTypeId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    defectTypeId = data.defectType.id;
  });

  it('should create a defect record', async () => {
    const response = await request(app.server)
      .post('/v1/production/defect-records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        defectTypeId,
        operatorId: userId,
        quantity: 3,
        severity: 'MAJOR',
        description: 'Visible surface scratches on product',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('defectRecord');
    expect(response.body.defectRecord).toHaveProperty('id');
    expect(response.body.defectRecord.defectTypeId).toBe(defectTypeId);
    expect(response.body.defectRecord.quantity).toBe(3);
    expect(response.body.defectRecord.severity).toBe('MAJOR');
  });
});
