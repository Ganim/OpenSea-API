import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Company Address (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a company address', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create an company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Legal Name',
      cnpj: '99876543000101',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'FISCAL',
        zip: '01234-567',
        street: 'Rua Teste',
        number: '123',
        city: 'São Paulo',
        state: 'SP',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('address');
    expect(response.body.address).toMatchObject({
      type: 'FISCAL',
      zip: '01234-567',
      isPrimary: false,
    });
    expect(response.body.address.id).toBeDefined();
    expect(response.body.address.companyId).toBe(companyId);
  });

  it('should allow ADMIN to create a company address', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Admin Legal',
      cnpj: '99876543000102',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'DELIVERY',
        zip: '76543-210',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.address.type).toBe('DELIVERY');
  });

  it('should NOT allow user without permission to create a company address', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company User Legal',
      cnpj: '99876543000103',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'BILLING',
        zip: '12345-678',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Auth Legal',
      cnpj: '99876543000104',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .send({
        type: 'OTHER',
        zip: '11111-111',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when zip is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Invalid Zip Legal',
      cnpj: '99876543000105',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'FISCAL',
        zip: 'invalid-zip',
      });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 when duplicate type for same company', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Duplicate Legal',
      cnpj: '99876543000106',
    });

    const companyId = company.id.toString();

    // Create first address
    await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'FISCAL',
        zip: '01234-567',
      });

    // Try to create another with same type
    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'FISCAL',
        zip: '76543-210',
      });

    expect(response.statusCode).toBe(400);
  });

  it('should create address with isPrimary flag', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Primary Legal',
      cnpj: '99876543000107',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'FISCAL',
        zip: '01234-567',
        isPrimary: true,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.address.isPrimary).toBe(true);
  });

  it('should include pending issues in response', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Pending Legal',
      cnpj: '99876543000108',
    });

    const companyId = company.id.toString();

    // Create address with only zip (minimal required)
    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        zip: '01234-567',
      });

    expect(response.statusCode).toBe(201);
    expect(Array.isArray(response.body.address.pendingIssues)).toBe(true);
    expect(response.body.address.pendingIssues.length).toBeGreaterThan(0);
  });
});
