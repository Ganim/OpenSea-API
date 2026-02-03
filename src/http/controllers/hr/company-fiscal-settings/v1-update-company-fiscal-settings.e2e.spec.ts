import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { makeCreateCompanyFiscalSettingsUseCase } from '@/use-cases/hr/company-fiscal-settings/factories/make-company-fiscal-settings';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Company Fiscal Settings (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update company fiscal settings with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      tenantId,
      legalName: `Test Company Update Fiscal ${timestamp}`,
      cnpj: `${timestamp}`.slice(-14).padStart(14, '0'),
    });

    const companyId = company.id.toString();

    const createFiscalUseCase = makeCreateCompanyFiscalSettingsUseCase();
    await createFiscalUseCase.execute({
      companyId,
      digitalCertificateType: 'NONE',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${companyId}/fiscal-settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nfeEnvironment: 'HOMOLOGATION',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('fiscalSettings');
  });
});
