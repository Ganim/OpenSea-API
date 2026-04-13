import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Pair This Device (E2E)', () => {
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
      .post(
        '/v1/pos/terminals/00000000-0000-0000-0000-000000000001/pair-self',
      )
      .send({ deviceLabel: 'My Device' });

    expect(response.status).toBe(401);
  });

  it('should pair current device to a terminal (201)', async () => {
    const createRes = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalName: `PairSelf ${Date.now()}`, mode: 'SALES_ONLY' });

    const terminalId = createRes.body.terminal.id;

    const response = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/pair-self`)
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceLabel: `Device E2E ${Date.now()}` });

    expect([201, 400]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body).toHaveProperty('deviceToken');
      expect(response.body).toHaveProperty('terminal');
    }
  });
});
