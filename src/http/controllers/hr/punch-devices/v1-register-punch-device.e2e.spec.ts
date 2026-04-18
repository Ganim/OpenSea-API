import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Register Punch Device (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/punch-devices')
      .send({ name: 'Kiosk Teste', deviceKind: 'KIOSK_PUBLIC' });

    expect(response.status).toBe(401);
  });

  it('should register a new punch device (201) with pairingSecret', async () => {
    const timestamp = Date.now();
    const response = await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk Teste ${timestamp}`,
        deviceKind: 'KIOSK_PUBLIC',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('deviceId');
    expect(response.body).toHaveProperty('pairingSecret');
    expect(typeof response.body.deviceId).toBe('string');
    expect(response.body.pairingSecret).toHaveLength(64);
  });

  it('should reject invalid deviceKind (400 or 422)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk Inválido ${Date.now()}`,
        deviceKind: 'NAO_EXISTE',
      });

    expect([400, 422]).toContain(response.status);
  });
});
