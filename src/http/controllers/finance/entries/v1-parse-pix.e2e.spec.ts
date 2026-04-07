import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Parse Pix (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should parse a valid Copia e Cola code', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Valid BR Code (Pix Copia e Cola) with CPF key, merchant name, city and amount
    const copiaECola =
      '00020126580014br.gov.bcb.pix0136123.456.789-09520400005303986540510.005802BR5913Fulano de Tal6008Brasilia62070503***6304B13E';

    const response = await request(app.server)
      .post('/v1/finance/parse-pix')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: copiaECola });

    expect(response.status).toBe(200);
    expect(response.body.pix).toBeDefined();
    expect(response.body.pix.type).toBe('COPIA_COLA');
    expect(response.body.pix.pixKey).toBeDefined();
    expect(response.body.pix.pixKeyType).toBeDefined();
  });

  it('should parse a valid CPF key', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/parse-pix')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123.456.789-09' });

    expect(response.status).toBe(200);
    expect(response.body.pix).toBeDefined();
    expect(response.body.pix.type).toBe('CHAVE');
    expect(response.body.pix.pixKeyType).toBe('CPF');
    expect(response.body.pix.pixKey).toBe('123.456.789-09');
  });

  it('should return 400 for empty code', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/parse-pix')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '' });

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/parse-pix')
      .send({ code: '123.456.789-09' });

    expect(response.status).toBe(401);
  });
});
