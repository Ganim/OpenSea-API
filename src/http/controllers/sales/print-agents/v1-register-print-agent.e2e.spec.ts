import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Register Print Agent (E2E)', () => {
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
      .post('/v1/sales/print-agents')
      .send({ name: 'Test Agent' });

    expect(response.status).toBe(401);
  });

  it('should register a new print agent (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/print-agents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Print Agent ${timestamp}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('agentId');
    expect(typeof response.body.agentId).toBe('string');
  });
});
