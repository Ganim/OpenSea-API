import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Pair Punch Device (E2E)', () => {
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
      .post('/v1/hr/punch-devices/00000000-0000-0000-0000-000000000000/pair')
      .set('Authorization', `Bearer ${token}`)
      .send({ pairingCode: 'ABC123', hostname: 'test-host' });

    expect(response.status).toBe(404);
  });

  it('should reject invalid pairing code (400)', async () => {
    const registerResponse = await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk Pair Invalid ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
      });

    const deviceId = registerResponse.body.deviceId;

    const response = await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/pair`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pairingCode: 'ZZZZZZ', hostname: 'test-host' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should pair successfully with valid TOTP code (200)', async () => {
    const registerResponse = await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk Pair Valid ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
      });

    const deviceId = registerResponse.body.deviceId;

    // Obter código TOTP atual
    const codeResponse = await request(app.server)
      .get(`/v1/hr/punch-devices/${deviceId}/pairing-code`)
      .set('Authorization', `Bearer ${token}`);

    expect(codeResponse.status).toBe(200);
    const { code } = codeResponse.body;

    // Parear
    const response = await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/pair`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pairingCode: code, hostname: `host-${Date.now()}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deviceToken');
    expect(response.body).toHaveProperty('deviceId');
    expect(response.body).toHaveProperty('deviceName');
    expect(response.body.deviceToken).toHaveLength(64);
  });
});
