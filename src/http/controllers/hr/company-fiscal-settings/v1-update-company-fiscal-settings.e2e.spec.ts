import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { makeCreateCompanyFiscalSettingsUseCase } from '@/use-cases/hr/company-fiscal-settings/factories/make-company-fiscal-settings';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Company Fiscal Settings (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to update fiscal settings', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Update Fiscal',
      cnpj: '12345678000203',
    });

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    await createFiscalUseCase.execute({
      companyId: company.id.toString(),
      digitalCertificateType: 'NONE',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nfceEnabled: false,
        digitalCertificateType: 'NONE',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.fiscalSettings.nfceEnabled).toBe(false);
  });

  it('should NOT allow decreasing nfeLastNumber', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Decrease Fiscal',
      cnpj: '12345678000204',
    });

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    await createFiscalUseCase.execute({
      companyId: company.id.toString(),
      nfeLastNumber: 100,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nfeLastNumber: 50,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('increased');
  });

  it('should return 404 when fiscal settings do not exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Not Found Update',
      cnpj: '12345678000205',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nfceEnabled: true,
      });

    expect(response.statusCode).toBe(404);
  });

  it('should NOT allow user without permission to update fiscal settings', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company User Update',
      cnpj: '12345678000206',
    });

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    await createFiscalUseCase.execute({
      companyId: company.id.toString(),
    });

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nfceEnabled: true,
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Auth Update',
      cnpj: '12345678000207',
    });

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    await createFiscalUseCase.execute({
      companyId: company.id.toString(),
    });

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .send({
        nfceEnabled: true,
      });

    expect(response.statusCode).toBe(401);
  });
});
