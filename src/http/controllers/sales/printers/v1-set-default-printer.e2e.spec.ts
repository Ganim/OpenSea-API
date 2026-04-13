import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Set Default Printer (E2E)', () => {
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
    const response = await request(app.server).patch(
      '/v1/sales/printers/some-id/default',
    );

    expect(response.status).toBe(401);
  });

  it('should set a printer as default (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/sales/printers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `DefaultPrinter ${Date.now()}`,
        type: 'THERMAL',
        connection: 'NETWORK',
        ipAddress: '192.168.1.101',
        port: 9100,
        paperWidth: 80,
      });

    const printerId = createRes.body.id;

    const response = await request(app.server)
      .patch(`/v1/sales/printers/${printerId}/default`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(printerId);
    expect(response.body.isDefault).toBe(true);
  });
});
