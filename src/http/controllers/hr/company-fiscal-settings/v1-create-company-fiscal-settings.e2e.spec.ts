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

  it('should allow MANAGER to create fiscal settings', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Fiscal',
      cnpj: '12345678000195',
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
    expect(response.body.fiscalSettings).toMatchObject({
      companyId,
      digitalCertificateType: 'NONE',
      nfceEnabled: false,
    });
    expect(response.body.fiscalSettings.id).toBeDefined();
  });

  it('should NOT allow creating fiscal settings twice for same company', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Duplicate Fiscal',
      cnpj: '12345678000196',
    });

    const companyId = company.id.toString();

    // First creation should succeed
    const firstResponse = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        digitalCertificateType: 'NONE',
      });

    expect(firstResponse.statusCode).toBe(201);

    // Second creation should fail
    const secondResponse = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        digitalCertificateType: 'NONE',
      });

    expect(secondResponse.statusCode).toBe(400);
    expect(secondResponse.body.message).toContain('already exist');
  });

  it('should NOT allow user without permission to create fiscal settings', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company User Fiscal',
      cnpj: '12345678000197',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        digitalCertificateType: 'NONE',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Auth Fiscal',
      cnpj: '12345678000198',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/fiscal-settings`)
      .send({
        digitalCertificateType: 'NONE',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should compute pending issues when NFe environment is set without required fields', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company NFe Pending',
      cnpj: '12345678000199',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nfeEnvironment: 'PRODUCTION',
        digitalCertificateType: 'NONE',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.fiscalSettings.pendingIssues).toContain('nfeSeries');
    expect(response.body.fiscalSettings.pendingIssues).toContain(
      'nfeLastNumber',
    );
  });
});
