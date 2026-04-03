import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Webhook Shopee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should accept Shopee webhook notification', async () => {
    const response = await request(app.server)
      .post('/v1/webhooks/marketplace/shopee')
      .send({
        shop_id: 12345,
        code: 3,
        timestamp: Math.floor(Date.now() / 1000),
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('received', true);
  });
});
