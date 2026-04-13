import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Register Printer (E2E)', () => {
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
      .post('/v1/sales/printers')
      .send({ name: 'Test Printer' });

    expect(response.status).toBe(401);
  });

  it('should register a thermal printer (201)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/printers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Printer E2E ${Date.now()}`,
        type: 'THERMAL',
        connection: 'NETWORK',
        ipAddress: '192.168.1.100',
        port: 9100,
        paperWidth: 80,
        isDefault: false,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('active');
  });

  it('should return 400 with invalid body', async () => {
    const response = await request(app.server)
      .post('/v1/sales/printers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(response.status).toBe(400);
  });
});
