import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Company CNAE (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create company cnae with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      tenantId,
      legalName: `Test Company ${timestamp}`,
      cnpj: `${timestamp}`.slice(-14).padStart(14, '0'),
    });

    const companyId = company.id.toString();

    const response = await request(app.server)
      .post(`/v1/hr/companies/${companyId}/cnaes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '4711301', isPrimary: true });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('cnae');
    expect(response.body.cnae).toHaveProperty('id');
  });
});
