import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/admin/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Companies - HR read-only (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list companies with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create a company via use case so there's data to list
    const createCompanyUseCase = makeCreateCompanyUseCase();
    await createCompanyUseCase.execute({
      tenantId,
      legalName: `Test Company ${Date.now()}`,
      cnpj: `${Date.now()}`.slice(-14).padStart(14, '0'),
    });

    const response = await request(app.server)
      .get('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
