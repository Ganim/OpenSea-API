import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create eSocial Rubrica (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a rubrica', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/esocial/rubricas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `RUB-${Date.now()}`,
        description: 'Salario Base Test',
        type: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('rubrica');
    expect(response.body.rubrica).toHaveProperty('id');
    expect(response.body.rubrica.typeLabel).toBe('Vencimento');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/esocial/rubricas')
      .send({ code: 'RUB-001', description: 'Test', type: 1 });

    expect(response.status).toBe(401);
  });
});
