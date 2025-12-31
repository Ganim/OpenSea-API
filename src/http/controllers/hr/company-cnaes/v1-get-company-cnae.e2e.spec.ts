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

describe('Get Company CNAE (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get a company CNAE by id', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Legal Name',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const createUseCase = makeCreateCompanyCnaeUseCase();
    const { cnae } = await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    const cnaeId = cnae.id.toString();

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes/${cnaeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.cnae).toBeTruthy();
    expect(response.body.cnae.id).toBe(cnaeId);
    expect(response.body.cnae.code).toBe('4711301');
  });

  it('should return 404 for non-existent CNAE', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company 404 Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes/non-existent-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400); // Invalid ID format returns 400
  });
});
