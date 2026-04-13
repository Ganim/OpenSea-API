import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Print Agents (E2E)', () => {
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
    const response = await request(app.server).get('/v1/sales/print-agents');

    expect(response.status).toBe(401);
  });

  it('should list print agents (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/print-agents')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('agents');
    expect(Array.isArray(response.body.agents)).toBe(true);
  });

  it('should return agents after creating one', async () => {
    const timestamp = Date.now();

    // Create a print agent first
    await request(app.server)
      .post('/v1/sales/print-agents')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Agent List Test ${timestamp}` });

    const response = await request(app.server)
      .get('/v1/sales/print-agents')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.agents.length).toBeGreaterThanOrEqual(1);
    expect(response.body.agents[0]).toHaveProperty('id');
    expect(response.body.agents[0]).toHaveProperty('name');
    expect(response.body.agents[0]).toHaveProperty('status');
  });
});
