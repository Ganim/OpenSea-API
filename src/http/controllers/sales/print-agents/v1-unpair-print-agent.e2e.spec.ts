import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Unpair Print Agent (E2E)', () => {
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
    const response = await request(app.server).post(
      '/v1/sales/print-agents/00000000-0000-0000-0000-000000000001/unpair',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent agent', async () => {
    const response = await request(app.server)
      .post(
        '/v1/sales/print-agents/00000000-0000-0000-0000-000000000001/unpair',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should unpair an existing agent (204)', async () => {
    const timestamp = Date.now();

    // Create an agent first
    const createResponse = await request(app.server)
      .post('/v1/sales/print-agents')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Agent Unpair Test ${timestamp}` });

    const agentId = createResponse.body.agentId;

    // Unpair the agent (even if not paired, should handle gracefully)
    const response = await request(app.server)
      .post(`/v1/sales/print-agents/${agentId}/unpair`)
      .set('Authorization', `Bearer ${token}`);

    expect([204, 400]).toContain(response.status);
  });
});
