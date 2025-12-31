import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { makeCreateCompanyFiscalSettingsUseCase } from '@/use-cases/hr/company-fiscal-settings/factories/make-company-fiscal-settings';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Company Fiscal Settings (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to get fiscal settings', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Get Fiscal',
      cnpj: '12345678000200',
    });

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    const { fiscalSettings } = await createFiscalUseCase.execute({
      companyId: company.id.toString(),
      digitalCertificateType: 'NONE',
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('fiscalSettings');
    expect(response.body.fiscalSettings.id).toBe(fiscalSettings.id.toString());
    expect(response.body.fiscalSettings.companyId).toBe(company.id.toString());
  });

  it('should return 404 when fiscal settings do not exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Not Found Fiscal',
      cnpj: '12345678000201',
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('should return 401 when no token is provided', async () => {
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Auth Get Fiscal',
      cnpj: '12345678000202',
    });

    const response = await request(app.server).get(
      `/v1/hr/companies/${company.id.toString()}/fiscal-settings`,
    );

    expect(response.statusCode).toBe(401);
  });
});
