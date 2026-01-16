import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { makeCreateCompanyStakeholderUseCase } from '@/use-cases/hr/company-stakeholder/factories';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete Company Stakeholder (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete company stakeholder with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: `Test Company Delete Stakeholder ${timestamp}`,
      cnpj: `${timestamp}`.slice(-14).padStart(14, '0'),
    });

    const companyId = company.id.toString();

    const createStakeholderUseCase = makeCreateCompanyStakeholderUseCase();
    const { stakeholder } = await createStakeholderUseCase.execute({
      companyId,
      name: 'Stakeholder to Delete',
      role: 'SOCIO',
    });

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${companyId}/stakeholders/${stakeholder.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });
});
