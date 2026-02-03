import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Company Stakeholder (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update company stakeholder with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      tenantId,
      legalName: `Test Company Update Stakeholder ${timestamp}`,
      cnpj: `${timestamp}`.slice(-14).padStart(14, '0'),
    });

    const createResponse = await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Original Name',
        role: 'SOCIO',
      });

    const stakeholderId = createResponse.body.id;

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${company.id}/stakeholders/${stakeholderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        role: 'ADMINISTRADOR',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Updated Name');
    expect(response.body.role).toBe('ADMINISTRADOR');
  });
});
