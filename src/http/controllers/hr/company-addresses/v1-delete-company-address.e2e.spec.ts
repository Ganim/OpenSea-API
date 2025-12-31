import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyAddressUseCase } from '@/use-cases/hr/company-addresses/factories/make-company-addresses';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete Company Address (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to delete a company address', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Delete Legal',
      cnpj: '77876543000101',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();
    const { address } = await createAddressUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });

    const addressId = address.id.toString();

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should allow ADMIN to delete a company address', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Admin Delete Legal',
      cnpj: '77876543000102',
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
      .delete(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should NOT allow user without permission to delete a company address', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company User Delete Legal',
      cnpj: '77876543000103',
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
      .delete(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Auth Delete Legal',
      cnpj: '77876543000104',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();
    const { address } = await createAddressUseCase.execute({
      companyId,
      type: 'OTHER',
      zip: '11111-111',
    });

    const addressId = address.id.toString();

    const response = await request(app.server).delete(
      `/v1/hr/companies/${companyId}/addresses/${addressId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 204 even when address does not exist (idempotent)', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Not Found Delete Legal',
      cnpj: '77876543000105',
    });

    const companyId = company.id.toString();
    const fakeAddressId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${companyId}/addresses/${fakeAddressId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should not be able to get deleted address after deletion', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Verify Delete Legal',
      cnpj: '77876543000106',
    });

    const companyId = company.id.toString();

    const createAddressUseCase = makeCreateCompanyAddressUseCase();
    const { address } = await createAddressUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });

    const addressId = address.id.toString();

    // Delete the address
    await request(app.server)
      .delete(`/v1/hr/companies/${companyId}/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`);

    // Try to list addresses without includeDeleted
    const listResponse = await request(app.server)
      .get(`/v1/hr/companies/${companyId}/addresses`)
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.statusCode).toBe(200);
    const addressIds = listResponse.body.addresses.map(
      (a: { id: string }) => a.id,
    );
    expect(addressIds).not.toContain(addressId);
  });
});
