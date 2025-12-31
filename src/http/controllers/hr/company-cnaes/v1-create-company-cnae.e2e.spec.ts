import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

function generateRandomCNPJ(): string {
  const randomPart = Math.floor(Math.random() * 99999999)
    .toString()
    .padStart(8, '0');
  return `${randomPart}000195`;
}

describe('Create Company CNAE (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a company CNAE', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create an company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Legal Name',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/cnaes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: '4711301',
        isPrimary: true,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('cnae');
    expect(response.body.cnae.code).toBe('4711301');
    expect(response.body.cnae.isPrimary).toBe(true);
  });

  it('should reject when code is not 7-digit', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Invalid Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/cnaes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'invalid',
      });

    expect(response.statusCode).toBe(400);
  });

  it('should auto-unset previous primary when setting new one', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Primary Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    // Create first CNAE as primary
    const firstResponse = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/cnaes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: '4711301',
        isPrimary: true,
      });

    expect(firstResponse.statusCode).toBe(201);
    expect(firstResponse.body.cnae.isPrimary).toBe(true);

    // Create second CNAE as primary (should unset first)
    const secondResponse = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/cnaes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: '4711302',
        isPrimary: true,
      });

    expect(secondResponse.statusCode).toBe(201);
  });
});
