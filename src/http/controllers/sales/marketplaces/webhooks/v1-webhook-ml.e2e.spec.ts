import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Webhook Mercado Livre (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should accept ML webhook notification', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/marketplace/ml')
      .send({
        resource: '/orders/123456',
        user_id: 999,
        topic: 'orders_v2',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('received', true);
  });
});
