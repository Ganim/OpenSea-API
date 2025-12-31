import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { makeCreateCompanyCnaeUseCase } from '@/use-cases/hr/company-cnaes/factories/make-company-cnaes';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

type CnaeItem = {
  code: string;
  isPrimary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
};

function generateRandomCNPJ(): string {
  const randomPart = Math.floor(Math.random() * 99999999)
    .toString()
    .padStart(8, '0');
  return `${randomPart}000195`;
}

describe('List Company CNAEs (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list company CNAEs with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create an company
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Legal Name',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    // Create a CNAE for listing
    const createUseCase = makeCreateCompanyCnaeUseCase();
    await createUseCase.execute({
      companyId,
      code: '4711301',
      isPrimary: true,
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.cnaes)).toBe(true);
    expect(response.body.meta).toBeTruthy();
    expect(response.body.meta.page).toBe(1);
  });

  it('should filter by code', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Filter Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const createUseCase = makeCreateCompanyCnaeUseCase();
    await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes?code=4711301`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.cnaes.length).toBeGreaterThanOrEqual(1);
    const cnaes = response.body.cnaes as CnaeItem[];
    expect(cnaes.some((c) => c.code === '4711301')).toBe(true);
  });

  it('should filter by isPrimary', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Primary Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const createUseCase = makeCreateCompanyCnaeUseCase();
    await createUseCase.execute({
      companyId,
      code: '4711301',
      isPrimary: true,
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes?isPrimary=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.cnaes.length).toBeGreaterThanOrEqual(1);
    const cnaes = response.body.cnaes as CnaeItem[];
    expect(cnaes.some((c) => c.isPrimary === true)).toBe(true);
  });

  it('should filter by status', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Status Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const createUseCase = makeCreateCompanyCnaeUseCase();
    await createUseCase.execute({
      companyId,
      code: '4711301',
      status: 'ACTIVE',
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes?status=ACTIVE`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    const cnaes = response.body.cnaes as CnaeItem[];
    expect(cnaes.every((c) => c.status === 'ACTIVE')).toBe(true);
  });

  it('should support pagination with perPage', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Pagination Legal',
      cnpj: generateRandomCNPJ(),
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/cnaes?page=1&perPage=10`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.perPage).toBe(10);
  });
});
