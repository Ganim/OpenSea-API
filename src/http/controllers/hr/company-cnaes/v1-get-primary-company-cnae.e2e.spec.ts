import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { makeCreateCompanyCnaeUseCase } from '@/use-cases/hr/company-cnaes/factories/make-company-cnaes';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

function generateRandomCNPJ(): string {
  const randomPart = Math.floor(Math.random() * 99999999)
    .toString()
    .padStart(8, '0');
  return `${randomPart}000195`;
}

describe('Get Primary Company CNAE (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get primary CNAE for a company', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Legal Name',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    // Create a primary CNAE
    const createUseCase = makeCreateCompanyCnaeUseCase();
    await createUseCase.execute({
      companyId,
      code: '4711301',
      isPrimary: true,
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes/primary`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.cnae).toBeTruthy();
    expect(response.body.cnae.isPrimary).toBe(true);
    expect(response.body.cnae.code).toBe('4711301');
  });

  it('should return null when no primary CNAE exists', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Primary Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes/primary`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.cnae).toBeNull();
  });

  it('should return latest primary when multiple CNAEs exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Multiple Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();
    const createUseCase = makeCreateCompanyCnaeUseCase();

    // Create first CNAE
    await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    // Create second CNAE as primary (should become primary)
    await createUseCase.execute({
      companyId,
      code: '4721000',
      isPrimary: true,
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes/primary`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.cnae.code).toBe('4721000');
    expect(response.body.cnae.isPrimary).toBe(true);
  });
});
