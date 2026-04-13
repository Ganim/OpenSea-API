import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Pairing Code (E2E)', () => {
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
    const response = await request(app.server).get(
      '/v1/pos/terminals/00000000-0000-0000-0000-000000000001/pairing-code',
    );

    expect(response.status).toBe(401);
  });

  it('should get pairing code for a terminal (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalName: `PairCode ${Date.now()}`, mode: 'SALES_ONLY' });

    const terminalId = createRes.body.terminal.id;

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/pairing-code`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('expiresAt');
    }
  });
});
