import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { makeCreateCompanyAddressUseCase } from '@/use-cases/hr/company-addresses/factories/make-company-addresses';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Company Addresses (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list all company addresses', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company List Legal',
      cnpj: '99876543000201',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();

    // Create multiple addresses
    await createAddressUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });

    await createAddressUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '76543-210',
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('addresses');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.addresses)).toBe(true);
    expect(response.body.addresses.length).toBe(2);
    expect(response.body.meta).toMatchObject({
      total: 2,
      page: 1,
      perPage: 20,
      totalPages: 1,
    });
  });

  it('should filter addresses by type', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Filter Type Legal',
      cnpj: '99876543000202',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();

    await createAddressUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });

    await createAddressUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '76543-210',
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/addresses?type=FISCAL`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.addresses.length).toBe(1);
    expect(response.body.addresses[0].type).toBe('FISCAL');
  });

  it('should filter addresses by isPrimary', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Filter Primary Legal',
      cnpj: '99876543000203',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();

    await createAddressUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
      isPrimary: true,
    });

    await createAddressUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '76543-210',
      isPrimary: false,
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/addresses?isPrimary=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.addresses.length).toBe(1);
    expect(response.body.addresses[0].isPrimary).toBe(true);
  });

  it('should support pagination', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Pagination Legal',
      cnpj: '99876543000204',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();

    // Create multiple addresses
    const types = ['FISCAL', 'DELIVERY', 'BILLING', 'OTHER'] as const;
    for (const type of types) {
      await createAddressUseCase.execute({
        companyId,
        type,
        zip: '01234-567',
      });
    }

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/addresses?page=1&perPage=2`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.addresses.length).toBe(2);
    expect(response.body.meta).toMatchObject({
      total: 4,
      page: 1,
      perPage: 2,
      totalPages: 2,
    });
  });

  it('should return 401 when no token is provided', async () => {
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Auth List Legal',
      cnpj: '99876543000205',
    });

    const companyId = company.id.toString();

    const response = await request(app.server).get(
      `/v1/hr/companies/${companyId}/addresses`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return empty list for company with no addresses', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Empty Legal',
      cnpj: '99876543000206',
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.addresses.length).toBe(0);
    expect(response.body.meta.total).toBe(0);
  });
});
