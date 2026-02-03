import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Company Stakeholder (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create company stakeholder with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      tenantId,
      legalName: `Test Company Stakeholder ${timestamp}`,
      cnpj: `${timestamp}`.slice(-14).padStart(14, '0'),
    });

    const response = await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'João da Silva',
        role: 'SOCIO',
        entryDate: new Date('2020-01-01').toISOString(),
        isLegalRepresentative: true,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('João da Silva');
    expect(response.body.role).toBe('SOCIO');
  });
});
