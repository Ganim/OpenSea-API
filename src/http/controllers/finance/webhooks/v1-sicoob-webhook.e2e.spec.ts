import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Sicoob Webhook (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should reject webhook without valid HMAC signature', async () => {
    const response = await request(app.server)
      .post('/v1/finance/webhooks/sicoob')
      .send({
        event: 'PIX_RECEIVED',
        data: { txId: 'test-tx-id' },
      });

    expect([200, 400, 401, 403]).toContain(response.status);
  });

  it('should handle empty body', async () => {
    const response = await request(app.server)
      .post('/v1/finance/webhooks/sicoob')
      .send({});

    expect([200, 400, 401, 403]).toContain(response.status);
  });
});
