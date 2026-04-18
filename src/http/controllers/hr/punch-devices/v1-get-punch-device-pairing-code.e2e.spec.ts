import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Punch Device Pairing Code (E2E)', () => {
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
      .get(
        `/v1/hr/punch-devices/00000000-0000-0000-0000-000000000000/pairing-code`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return a TOTP code (200) for an unpaired device', async () => {
    // Create a device first
    const registerResponse = await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk Pair Code ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
      });

    expect(registerResponse.status).toBe(201);
    const deviceId = registerResponse.body.deviceId;

    const response = await request(app.server)
      .get(`/v1/hr/punch-devices/${deviceId}/pairing-code`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('expiresAt');
    expect(response.body.code).toHaveLength(6);
  });
});
