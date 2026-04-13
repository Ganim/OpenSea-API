import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
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
      '/v1/sales/print-agents/00000000-0000-0000-0000-000000000001/pairing-code',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent agent', async () => {
    const response = await request(app.server)
      .get(
        '/v1/sales/print-agents/00000000-0000-0000-0000-000000000001/pairing-code',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return pairing code for an existing agent (200)', async () => {
    const timestamp = Date.now();

    // Create an agent first
    const createResponse = await request(app.server)
      .post('/v1/sales/print-agents')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Agent Pairing Test ${timestamp}` });

    const agentId = createResponse.body.agentId;

    const response = await request(app.server)
      .get(`/v1/sales/print-agents/${agentId}/pairing-code`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('expiresAt');
    expect(typeof response.body.code).toBe('string');
  });
});
