import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateCompanyData } from '@/utils/tests/factories/hr/create-company.e2e';

describe('Update Company (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update company with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const companyData = generateCompanyData();

    const createResponse = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    const companyId = createResponse.body.id;

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ legalName: 'Updated Company Name' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('legalName');
  });
});
