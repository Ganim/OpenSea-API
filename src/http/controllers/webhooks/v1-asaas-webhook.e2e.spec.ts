import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';

describe('Asaas Webhook (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should accept webhook payload and return 200', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/asaas')
      .send({
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_test_123',
          status: 'CONFIRMED',
          value: 100.0,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it('should return 200 even with empty payload', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/asaas')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
  });
});
