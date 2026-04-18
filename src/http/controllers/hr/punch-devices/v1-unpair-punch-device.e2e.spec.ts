import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Unpair Punch Device (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 404 for non-existent device', async () => {
    const response = await request(app.server)
      .post('/v1/hr/punch-devices/00000000-0000-0000-0000-000000000000/unpair')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(404);
  });

  it('should unpair a registered device (200)', async () => {
    // Create device
    const registerResponse = await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk Unpair ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
      });

    const deviceId = registerResponse.body.deviceId;

    // Unpair (idempotent — funciona mesmo sem pareamento prévio)
    const response = await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/unpair`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Teste automatizado' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it('should be idempotent (re-unpair returns 200)', async () => {
    const registerResponse = await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk Idempotent ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
      });

    const deviceId = registerResponse.body.deviceId;

    await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/unpair`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Primeira revogação' });

    const response = await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/unpair`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Segunda revogação' });

    expect(response.status).toBe(200);
  });
});
