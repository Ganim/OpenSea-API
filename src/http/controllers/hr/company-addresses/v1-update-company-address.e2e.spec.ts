import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyAddressUseCase } from '@/use-cases/hr/company-addresses/factories/make-company-addresses';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Company Address (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to update a company address', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Update Legal',
      cnpj: '88876543000101',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();
    const { address } = await createAddressUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
      street: 'Rua Original',
    });

    const addressId = address.id.toString();

    const response = await request(app.server)
      .put(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        street: 'Rua Atualizada',
        number: '456',
        city: 'São Paulo',
        state: 'SP',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('address');
    expect(response.body.address.street).toBe('Rua Atualizada');
    expect(response.body.address.number).toBe('456');
    expect(response.body.address.city).toBe('São Paulo');
    expect(response.body.address.state).toBe('SP');
  });

  it('should allow ADMIN to update a company address', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Admin Update Legal',
      cnpj: '88876543000102',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();
    const { address } = await createAddressUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '76543-210',
    });

    const addressId = address.id.toString();

    const response = await request(app.server)
      .put(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        district: 'Centro',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.address.district).toBe('Centro');
  });

  it('should NOT allow user without permission to update a company address', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company User Update Legal',
      cnpj: '88876543000103',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();
    const { address } = await createAddressUseCase.execute({
      companyId,
      type: 'BILLING',
      zip: '12345-678',
    });

    const addressId = address.id.toString();

    const response = await request(app.server)
      .put(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        street: 'Rua Nova',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Auth Update Legal',
      cnpj: '88876543000104',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();
    const { address } = await createAddressUseCase.execute({
      companyId,
      type: 'OTHER',
      zip: '11111-111',
    });

    const addressId = address.id.toString();

    const response = await request(app.server)
      .put(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .send({
        street: 'Rua Sem Auth',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when address does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Not Found Legal',
      cnpj: '88876543000105',
    });

    const companyId = company.id.toString();
    const fakeAddressId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/hr/companies/${companyId}/addresses/${fakeAddressId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        street: 'Rua Inexistente',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when changing to duplicate type', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Duplicate Type Legal',
      cnpj: '88876543000106',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();

    // Create first address with FISCAL type
    await createAddressUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });

    // Create second address with DELIVERY type
    const { address: secondAddress } = await createAddressUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '76543-210',
    });

    const addressId = secondAddress.id.toString();

    // Try to change second address type to FISCAL (duplicate)
    const response = await request(app.server)
      .put(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'FISCAL',
      });

    expect(response.statusCode).toBe(400);
  });

  it('should update isPrimary flag', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Primary Update Legal',
      cnpj: '88876543000107',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();
    const { address } = await createAddressUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
      isPrimary: false,
    });

    const addressId = address.id.toString();

    const response = await request(app.server)
      .put(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isPrimary: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.address.isPrimary).toBe(true);
  });
});
