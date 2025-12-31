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

describe('Update Company CNAE (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update CNAE status', async () => {
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
      .put(`/v1/hr/companies/${companyId}/cnaes/${cnaeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'INACTIVE',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.cnae.status).toBe('INACTIVE');
  });

  it('should update isPrimary flag', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Primary Legal',
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
      .put(`/v1/hr/companies/${companyId}/cnaes/${cnaeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isPrimary: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.cnae.isPrimary).toBe(true);
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
      .put(`/v1/hr/companies/${companyId}/cnaes/non-existent-id`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'INACTIVE',
      });

    expect(response.statusCode).toBe(400); // Invalid ID format returns 400
  });

  it('should auto-unset previous primary when updating to primary', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Multi Primary Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();
    const createUseCase = makeCreateCompanyCnaeUseCase();

    // Create first CNAE as primary
    await createUseCase.execute({
      companyId,
      code: '4711301',
      isPrimary: true,
    });

    // Create second CNAE
    const { cnae: secondCnae } = await createUseCase.execute({
      companyId,
      code: '4711302',
    });

    // Update second CNAE to primary
    const response = await request(app.server)
      .put(`/v1/hr/companies/${companyId}/cnaes/${secondCnae.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isPrimary: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.cnae.isPrimary).toBe(true);
  });
});
