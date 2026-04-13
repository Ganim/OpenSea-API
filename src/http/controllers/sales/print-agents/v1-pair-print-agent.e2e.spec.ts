import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Pair Print Agent (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
    await createAndSetupTenant();
  });

  it('should return 400 for invalid pairing code (public endpoint)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/print-agents/pair')
      .send({
        pairingCode: 'INVALID',
        hostname: 'test-machine',
      });

    expect([400, 422]).toContain(response.status);
  });

  it('should return 400 for non-existent pairing code', async () => {
    const response = await request(app.server)
      .post('/v1/sales/print-agents/pair')
      .send({
        pairingCode: 'ABC123',
        hostname: `test-host-${Date.now()}`,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
