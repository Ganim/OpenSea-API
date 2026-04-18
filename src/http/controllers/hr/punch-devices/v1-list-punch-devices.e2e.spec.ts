import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Punch Devices (E2E)', () => {
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
    const response = await request(app.server).get('/v1/hr/punch-devices');
    expect(response.status).toBe(401);
  });

  it('should list punch devices (200) with pagination shape', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('should NOT leak pairingSecret or deviceTokenHash (T-04-01 / Pitfall 5)', async () => {
    // Create 2 devices
    await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk List A ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
      });

    await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `PWA List B ${Date.now()}`,
        deviceKind: 'PWA_PERSONAL',
      });

    const response = await request(app.server)
      .get('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThanOrEqual(2);

    // Sentinelas de segurança — dois formatos possíveis (raw string e serialização)
    const bodyJson = JSON.stringify(response.body);
    expect(bodyJson).not.toContain('pairingSecret');
    expect(bodyJson).not.toContain('deviceTokenHash');
    expect(bodyJson).not.toContain('revokedReason');
  });

  it('should filter by deviceKind', async () => {
    await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Biometric Filter ${Date.now()}`,
        deviceKind: 'BIOMETRIC_READER',
      });

    const response = await request(app.server)
      .get('/v1/hr/punch-devices?deviceKind=BIOMETRIC_READER')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const kinds = response.body.items.map(
      (d: { deviceKind: string }) => d.deviceKind,
    );
    expect(kinds.every((k: string) => k === 'BIOMETRIC_READER')).toBe(true);
  });
});
