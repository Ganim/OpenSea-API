import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';

describe('InfinitePay Webhook (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should accept webhook payload and return 200', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/infinitepay')
      .send({
        event: 'payment.confirmed',
        data: {
          id: 'txn_test_456',
          status: 'confirmed',
          amount: 5000,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it('should return 200 even with empty payload', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/infinitepay')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
  });
});
