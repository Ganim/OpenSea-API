import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Fiscal Webhook (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should accept webhook without auth (public endpoint)', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/fiscal')
      .send({
        event: 'autorizada',
        accessKey: '12345678901234567890123456789012345678901234',
        protocol: 'PROT-001',
      });

    // Public endpoint — should not return 401
    expect(response.status).not.toBe(401);
    // Should return 200 (document not found but acknowledged)
    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
  });

  it('should return 400 without accessKey or externalId', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/fiscal')
      .send({
        event: 'autorizada',
      });

    expect(response.status).toBe(400);
  });
});
