import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyAddressUseCase } from '@/use-cases/hr/company-addresses/factories/make-company-addresses';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Company Address (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete company address with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      tenantId,
      legalName: `Test Company ${Date.now()}`,
      cnpj: `${Date.now()}`.slice(-14).padStart(14, '0'),
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

    expect(response.status).toBe(204);
  });
});
