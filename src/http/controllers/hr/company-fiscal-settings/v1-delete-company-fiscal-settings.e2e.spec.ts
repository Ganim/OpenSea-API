import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { makeCreateCompanyFiscalSettingsUseCase } from '@/use-cases/hr/company-fiscal-settings/factories/make-company-fiscal-settings';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete Company Fiscal Settings (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to delete fiscal settings', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Delete Fiscal',
      cnpj: '12345678000208',
    });

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    await createFiscalUseCase.execute({
      companyId: company.id.toString(),
    });

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should return 404 when fiscal settings do not exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Not Found Delete',
      cnpj: '12345678000209',
    });

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should NOT allow user without permission to delete fiscal settings', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company User Delete',
      cnpj: '12345678000210',
    });

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    await createFiscalUseCase.execute({
      companyId: company.id.toString(),
    });

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${company.id.toString()}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Auth Delete',
      cnpj: '12345678000211',
    });

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    await createFiscalUseCase.execute({
      companyId: company.id.toString(),
    });

    const response = await request(app.server).delete(
      `/v1/hr/companies/${company.id.toString()}/fiscal-settings`,
    );

    expect(response.statusCode).toBe(401);
  });
});
