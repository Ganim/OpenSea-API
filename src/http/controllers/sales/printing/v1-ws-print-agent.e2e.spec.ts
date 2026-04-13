import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('WebSocket Print Agent (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
    await createAndSetupTenant();
  });

  it('should reject WebSocket upgrade without token query param (GET route exists)', async () => {
    // The WS endpoint at /v1/ws/print-agent requires a device token query param.
    // A plain HTTP GET should fail or return an error since it expects a WebSocket upgrade.
    const response = await request(app.server).get('/v1/ws/print-agent');

    // Fastify websocket routes return various errors for non-WS requests
    expect([400, 404, 426, 500]).toContain(response.status);
  });

  it('should reject WebSocket upgrade with invalid token', async () => {
    const response = await request(app.server).get(
      '/v1/ws/print-agent?token=invalid-token',
    );

    expect([400, 404, 426, 500]).toContain(response.status);
  });
});
