import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Company Fiscal Settings (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create company fiscal settings with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: `Test Company Fiscal ${timestamp}`,
      cnpj: `${timestamp}`.slice(-14).padStart(14, '0'),
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        digitalCertificateType: 'NONE',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('fiscalSettings');
    expect(response.body.fiscalSettings).toHaveProperty('id');
    expect(response.body.fiscalSettings.companyId).toBe(companyId);
  });
});
