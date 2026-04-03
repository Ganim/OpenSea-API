import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('PIX Webhook (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should accept webhook without auth (public endpoint)', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/pix')
      .send({
        pix: [
          {
            endToEndId: 'E00000000202501011234abc',
            txid: 'test-tx-id-123',
            valor: '10.00',
          },
        ],
      });

    // Should not return 401 — this is a public endpoint
    expect(response.status).not.toBe(401);
  });

  it('should handle empty body gracefully', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/pix')
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
  });
});
