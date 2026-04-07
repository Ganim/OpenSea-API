import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Tracking Pixel (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return a transparent GIF (public, no auth)', async () => {
    const response = await request(app.server).get(
      '/v1/sales/tracking/quote/00000000-0000-0000-0000-000000000000/pixel.gif',
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/gif');
  });
});
