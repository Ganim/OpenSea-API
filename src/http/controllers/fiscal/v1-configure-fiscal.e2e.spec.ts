import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Configure Fiscal (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create fiscal configuration', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/fiscal/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'NUVEM_FISCAL',
        environment: 'HOMOLOGACAO',
        defaultCfop: '5102',
        taxRegime: 'SIMPLES_NACIONAL',
        defaultNaturezaOperacao: 'Venda de mercadoria',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
    expect(response.body.config).toHaveProperty('id');
    expect(response.body.config.provider).toBe('NUVEM_FISCAL');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/fiscal/config')
      .send({ provider: 'NUVEM_FISCAL' });

    expect(response.status).toBe(401);
  });
});
