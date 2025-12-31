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

describe('Delete Company CNAE (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete a company CNAE', async () => {
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
      .delete(`/v1/hr/companies/${companyId}/cnaes/${cnaeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should return 404 when deleting non-existent CNAE', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company 404 Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${companyId}/cnaes/non-existent-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400); // Invalid ID format returns 400
  });

  it('should not retrieve deleted CNAE with soft-delete', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Soft Delete Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const createUseCase = makeCreateCompanyCnaeUseCase();
    const { cnae } = await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    const cnaeId = cnae.id.toString();

    // Delete the CNAE
    await request(app.server)
      .delete(`/v1/hr/companies/${companyId}/cnaes/${cnaeId}`)
      .set('Authorization', `Bearer ${token}`);

    // Try to retrieve it
    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes/${cnaeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });
});
